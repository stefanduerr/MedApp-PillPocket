import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { LogoutButtonComponent } from './logout-button.component';

@NgModule({
    imports: [
        CommonModule,
        IonicModule,
    ],
    declarations: [LogoutButtonComponent],
    exports: [LogoutButtonComponent]
})
export class LogoutButtonComponentModule {}