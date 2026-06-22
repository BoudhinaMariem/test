import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { DxDataGridModule } from 'devextreme-angular/ui/data-grid';
import { DxChartModule } from 'devextreme-angular/ui/chart';
import { DxPieChartModule } from 'devextreme-angular/ui/pie-chart';
import { SharedModule } from 'app/shared/shared.module';
import { TranslocoModule } from '@ngneat/transloco';
import { TriwebSharedModule } from '../shared/triweb-shared.module';
import { TriwebDashboardComponent } from './dashboard.component';
import { triwebDashboardRoutes } from './dashboard.routing';

@NgModule({
    declarations: [TriwebDashboardComponent],
    imports: [
        CommonModule,
        FormsModule,
        RouterModule.forChild(triwebDashboardRoutes),
        MatButtonModule,
        MatChipsModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        SharedModule,
        TranslocoModule,
        TriwebSharedModule,
        DxDataGridModule, DxChartModule, DxPieChartModule
    ]
})
export class TriwebDashboardModule {}
