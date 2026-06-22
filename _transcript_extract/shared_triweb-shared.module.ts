import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GaugeKpiComponent } from './gauge-kpi/gauge-kpi.component';

@NgModule({
    declarations: [
        GaugeKpiComponent
    ],
    exports: [
        GaugeKpiComponent
    ],
    imports: [
        CommonModule
    ]
})
export class TriwebSharedModule {}
