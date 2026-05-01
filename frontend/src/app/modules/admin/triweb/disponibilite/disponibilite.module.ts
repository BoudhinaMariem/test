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
import { DxPieChartModule } from 'devextreme-angular/ui/pie-chart';
import { SharedModule } from 'app/shared/shared.module';
import { TriwebDisponibiliteComponent } from './disponibilite.component';
import { triwebDisponibiliteRoutes } from './disponibilite.routing';

@NgModule({
    declarations: [TriwebDisponibiliteComponent],
    imports: [
        CommonModule,
        FormsModule,
        RouterModule.forChild(triwebDisponibiliteRoutes),
        MatButtonModule,
        MatChipsModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        SharedModule,
        DxDataGridModule, DxPieChartModule
    ]
})
export class TriwebDisponibiliteModule {}
