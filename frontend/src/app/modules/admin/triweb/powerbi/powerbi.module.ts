import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { PowerbiComponent } from './powerbi.component';

const routes: Routes = [
    {
        path: '',
        component: PowerbiComponent
    }
];

@NgModule({
    declarations: [
        PowerbiComponent
    ],
    imports: [
        CommonModule,
        RouterModule.forChild(routes)
    ]
})
export class TriwebPowerbiModule
{
}