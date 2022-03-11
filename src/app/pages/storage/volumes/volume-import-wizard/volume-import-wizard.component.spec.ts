import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { Option } from 'app/interfaces/option.interface';
import { PoolFindResult } from 'app/interfaces/pool-import.interface';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { WebSocketService, DialogService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { VolumeImportWizardComponent } from './volume-import-wizard.component';

describe('VolumeImportWizardComponent', () => {
  let spectator: Spectator<VolumeImportWizardComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;

  const createComponent = createComponentFactory({
    component: VolumeImportWizardComponent,
    imports: [IxFormsModule, ReactiveFormsModule],
    providers: [
      DialogService,
      mockWebsocket([
        mockCall('pool.import_find', [{
          name: 'pool_name_1',
          guid: 'pool_guid_1',
          hostname: 'pool_hostname_1',
          status: PoolStatus.Online,
        }, {
          name: 'pool_name_2',
          guid: 'pool_guid_2',
          hostname: 'pool_hostname_2',
          status: PoolStatus.Online,
        }, {
          name: 'pool_name_3',
          guid: 'pool_guid_3',
          hostname: 'pool_hostname_3',
          status: PoolStatus.Online,
        }] as PoolFindResult[]),
        mockCall('pool.import_pool'),
      ]),
      mockProvider(IxSlideInService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    ws = spectator.inject(WebSocketService);
  });

  it('loads and shows the current list of pools to import when form is opened', () => {
    let pools: Option[];
    spectator.component.pool.options.subscribe((options) => pools = options);
    expect(ws.call).toHaveBeenCalledWith('pool.import_find');
    expect(pools).toEqual([
      { label: 'pool_name_1 | pool_guid_1', value: 'pool_guid_1' },
      { label: 'pool_name_2 | pool_guid_2', value: 'pool_guid_2' },
      { label: 'pool_name_3 | pool_guid_3', value: 'pool_guid_3' },
    ]);
  });

  it('doing the import', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      Pool: 'pool_name_1 | pool_guid_1',
    });

    const importButton = await loader.getHarness(MatButtonHarness.with({ text: 'Import' }));
    await importButton.click();

    expect(ws.call).toHaveBeenNthCalledWith(2, 'pool.import_pool', [{ guid: 'pool_guid_1' }]);
  });
});
