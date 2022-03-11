import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import {
  UntilDestroy, untilDestroyed,
} from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import helptext from 'app/helptext/storage/volumes/volume-import-wizard';
import { Option } from 'app/interfaces/option.interface';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { WebSocketService, DialogService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  templateUrl: './volume-import-wizard.component.html',
  styleUrls: ['./volume-import-wizard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VolumeImportWizardComponent {
  readonly helptext = helptext;
  isFormLoading = false;

  formGroup = this.fb.group({
    guid: ['' as string, Validators.required],
  });

  pool: {
    readonly fcName: 'guid';
    label: string;
    tooltip: string;
    readonly options: Observable<Option[]>;
  } = {
    fcName: 'guid',
    label: helptext.guid_placeholder,
    tooltip: helptext.guid_tooltip,
    options: this.ws.call('pool.import_find').pipe(
      map((pools) => {
        return pools.map((pool) => ({
          label: pool.name + ' | ' + pool.guid,
          value: pool.guid,
        }));
      }),
    ),
  };

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private slideInService: IxSlideInService,
    private errorHandler: FormErrorHandlerService,
    protected ws: WebSocketService,
    protected dialog: MatDialog,
    protected dialogService: DialogService,
    protected translate: TranslateService,
  ) {
  }

  onSubmit(): void {
    this.isFormLoading = true;

    this.ws.call('pool.import_pool', [{ guid: this.formGroup.value.guid }])
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.isFormLoading = false;
        this.cdr.markForCheck();
        this.slideInService.close();
      }, (error) => {
        this.isFormLoading = false;
        this.cdr.markForCheck();
        this.errorHandler.handleWsFormError(error, this.formGroup);
      });
  }
}
