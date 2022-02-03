import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  createComponentFactory, mockProvider, Spectator, SpectatorFactory,
} from '@ngneat/spectator/jest';
import { mockJob, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { DatasetAttachment } from 'app/interfaces/pool-attachment.interface';
import { Process } from 'app/interfaces/process.interface';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { ExportDisconnectModalComponent } from 'app/pages/storage/volumes/volumes-list/components/export-disconnect-modal.component';
import { DialogService, WebSocketService } from 'app/services';

const fakeData = {
  pool: {
    id: 9999,
    name: 'fakePool',
    status: PoolStatus.Healthy,
  },
  systemConfig: {
    pool: 'fakeSystemPool',
  },
  attachments: [
    { type: 'type1', attachments: ['partA,partB', 'part1,part2,part3'] },
    { type: 'type2', attachments: ['partX,partY', 'part4,part5,part6'] },
  ] as DatasetAttachment[],
  processes: [
    { name: 'process name 1' },
    { pid: 'pid1', cmdline: 'cmdline1' },
    { name: 'process name 2' },
    { pid: 'pid2', cmdline: 'cmdline2' },
  ] as Process[],
};

const warningPoolDetach = 'Back up critical data';
const warningUnknownState = 'is in the database but not connected to the machine';
const warningSysDataset = 'This pool contains the system dataset';

const expectedAttachmentLines = [
  'type1: - partA - partB - part1 - part2 - part3',
  'type2: - partX - partY - part4 - part5 - part6',
];

const expectedProcessLines = [
  '- process name 1 - process name 2',
  '- pid1 - cmdline1 - pid2 - cmdline2',
];

describe('ExportDisconnectModalComponent', () => {
  let spectator: Spectator<ExportDisconnectModalComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;

  function createComponentWithData(data: unknown): SpectatorFactory<ExportDisconnectModalComponent> {
    return createComponentFactory({
      component: ExportDisconnectModalComponent,
      imports: [
        IxFormsModule,
        ReactiveFormsModule,
      ],
      providers: [
        mockWebsocket([
          mockJob('pool.export'),
        ]),
        mockProvider(DialogService),
        mockProvider(MatDialogRef),
      ],
      componentProviders: [
        { provide: MAT_DIALOG_DATA, useFactory: () => data },
      ],
    });
  }

  describe('warnings block', () => {
    [

      {
        data: fakeData,
        expectedWarnings: [warningPoolDetach],
      },
      {
        data: { ...fakeData, pool: { ...fakeData.pool, status: PoolStatus.Unknown } },
        expectedWarnings: [warningUnknownState],
      },
      {
        data: { ...fakeData, pool: { ...fakeData.pool, name: 'fakeSystemPool' } },
        expectedWarnings: [warningPoolDetach, warningSysDataset],
      },

    ].forEach(({ expectedWarnings, data }) => {
      describe(`For status = '${data.pool.status}', name = '${data.pool.name}'`, () => {
        const createComponent = createComponentWithData(data);

        beforeEach(() => {
          spectator = createComponent();
          loader = TestbedHarnessEnvironment.loader(spectator.fixture);
          ws = spectator.inject(WebSocketService);
        });

        afterEach(() => {
          spectator.fixture.destroy();
        });

        it('warnings block should contain pool name', () => {
          const element = spectator.fixture.nativeElement as HTMLElement;
          expect(element.querySelector('.warnings-block')).toContainText(data.pool.name);
        });

        expectedWarnings.forEach((expectedText) => {
          it(`contains ${expectedText}`, () => {
            const element = spectator.fixture.nativeElement as HTMLElement;
            expect(element.querySelector('.warnings-block')).toContainText(expectedText);
          });
        });
      });
    });
  });

  describe('pool summary', () => {
    const createComponent = createComponentWithData(fakeData);

    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      ws = spectator.inject(WebSocketService);
    });

    afterEach(() => {
      spectator.fixture.destroy();
    });

    it('must contain pool name', () => {
      const element = spectator.fixture.nativeElement as HTMLElement;

      expect(element.querySelector('.pool-summary')).toContainText(fakeData.pool.name);
    });

    it('must contain attachments', () => {
      const element = spectator.fixture.nativeElement as HTMLElement;

      expectedAttachmentLines.forEach((expectedLine) => expect(element.querySelector('.pool-summary')).toContainText(expectedLine));
    });

    it('must contain processes', () => {
      const element = spectator.fixture.nativeElement as HTMLElement;

      expectedProcessLines.forEach((expectedLine) => expect(element.querySelector('.pool-summary')).toContainText(expectedLine));
    });
  });

  describe('form', () => {
    const createComponent = createComponentWithData(fakeData);

    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      ws = spectator.inject(WebSocketService);
    });

    afterEach(() => {
      spectator.fixture.destroy();
    });

    describe('when opened', () => {
      it('shows initial state of checkboxes', async () => {
        const form = await loader.getHarness(IxFormHarness);
        const values = await form.getValues();

        expect(values).toEqual({
          'Confirm Export/Disconnect': false,
          'Delete configuration of shares that used this pool?': true,
          'Destroy data on this pool?': false,
        });
      });
    });

    describe('when filled and submitted', () => {
      it('sends an update payload to websocket', async () => {
        const form = await loader.getHarness(IxFormHarness);
        await form.fillForm({
          'Confirm Export/Disconnect': true,
          'Delete configuration of shares that used this pool?': true,
          'Destroy data on this pool?': false,
        });

        const submitButton = await loader.getHarness(MatButtonHarness.with({ text: 'Export/Disconnect' }));
        await submitButton.click();

        expect(ws.job).toHaveBeenCalledWith('pool.export', [
          fakeData.pool.id,
          {
            cascade: true,
            destroy: false,
            restart_services: false,
          },
        ]);
      });
    });
  });
});