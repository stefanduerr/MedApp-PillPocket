import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { LoginButtonComponent } from './login-button.component';
import { LoginButtonRoutingModule } from './login-button-routing.module';

@NgModule({
    imports: [
        CommonModule,
        IonicModule,
        LoginButtonRoutingModule
    ],
    declarations: [LoginButtonComponent],
    exports: [LoginButtonComponent]
})
export class LoginButtonComponentModule {}