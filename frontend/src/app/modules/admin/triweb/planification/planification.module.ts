import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { DxChartModule } from 'devextreme-angular/ui/chart';
import { DxDataGridModule } from 'devextreme-angular/ui/data-grid';
import { SharedModule } from 'app/shared/shared.module';
import { TranslocoModule } from '@ngneat/transloco';
import { TriwebSharedModule } from '../shared/triweb-shared.module';
import { TriwebPlanificationComponent } from './planification.component';
import { triwebPlanificationRoutes } from './planification.routing';

@NgModule({
    declarations: [TriwebPlanificationComponent],
    imports: [
        CommonModule,
        FormsModule,
        RouterModule.forChild(triwebPlanificationRoutes),
        MatButtonModule,
        MatChipsModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        SharedModule,
        TranslocoModule,
        TriwebSharedModule,
        DxChartModule, DxDataGridModule
    ]
})
export class TriwebPlanificationModule {}
