import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { CoreComponents } from 'app/core/components/core-components.module';
import { AppLoaderComponent } from 'app/modules/app-loader/app-loader.component';
import { AppLoaderService } from 'app/modules/app-loader/app-loader.service';

@NgModule({
  imports: [
    CommonModule,
    CoreComponents,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslateModule,
  ],
  providers: [AppLoaderService],
  declarations: [AppLoaderComponent],
  exports: [AppLoaderComponent],
  entryComponents: [AppLoaderComponent],
})
export class AppLoaderModule { }