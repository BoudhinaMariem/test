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
import { TriwebPerformanceComponent } from './performance.component';
import { triwebPerformanceRoutes } from './performance.routing';

@NgModule({
    declarations: [TriwebPerformanceComponent],
    imports: [
        CommonModule,
        FormsModule,
        RouterModule.forChild(triwebPerformanceRoutes),
        MatButtonModule,
        MatChipsModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        SharedModule,
        DxChartModule, DxDataGridModule
    ]
})
export class TriwebPerformanceModule {}
