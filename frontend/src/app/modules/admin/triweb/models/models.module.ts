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
import { SharedModule } from 'app/shared/shared.module';
import { TriwebModelsComponent } from './models.component';
import { triwebModelsRoutes } from './models.routing';

@NgModule({
    declarations: [TriwebModelsComponent],
    imports: [
        CommonModule,
        FormsModule,
        RouterModule.forChild(triwebModelsRoutes),
        MatButtonModule,
        MatChipsModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        SharedModule,
        DxDataGridModule, DxChartModule
    ]
})
export class TriwebModelsModule {}
