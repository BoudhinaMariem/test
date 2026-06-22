import { Component, OnInit } from '@angular/core';

import {
    TriwebApiService,
    MlPredictionRequest,
} from '../triweb-api.service';

export interface MLResultRetard {
  niveau_risque_retard: string;
  prob_retard: number;
  risk_score: number;
}

export interface MLResultCharge {
  charge_estimee_heures: number;
  charge_estimee_minutes: number;
}

export interface MLResultAffectation {
  score_affectation: number;
  avis: string;
}

export interface MLResultFull {
  retard: MLResultRetard;
  charge: MLResultCharge;
  affectation: MLResultAffectation;
  explication: string[];
}

@Component({
    selector: 'app-models',
    templateUrl: './models.component.html'
})

export class ModelsComponent implements OnInit {
    loading = false;
    checkingApi = false;

    errorMessage = '';
    apiStatus: any = null;
    planningRiskResult: any = null;
    result: MLResultFull | null = null;
    
    form: MlPredictionRequest = this.getDefaultForm();

    positionOptions = [
        'Production',
        'Client',
        'CQ Client',
        'CQ Interne',
        'FTP',
        'Archive'
    ];

    statutOptions = [
        'En cours',
        'Livré',
        'Validé',
        'Non Conforme',
        'En instance'
    ];

    loiTypeOptions = [
        { label: '1 - Production Standard', value: 'production_standard' },
        { label: '2 - Refonte avec rédaction', value: 'refonte_avec_redaction' },
        { label: '3 - Refonte sans rédaction', value: 'refonte_sans_redaction' },
        { label: '4 - Ticket Modification', value: 'ticket_modification' },
        { label: 'Autre', value: 'autre' }
    ];

    etatOptions = [
        '',
        'Affecté',
        'En cours',
        'En pause',
        'Validé',
        'Retour CQ',
        'Retour CQ traité'
    ];

    
    constructor(private triwebApiService: TriwebApiService) {}

    ngOnInit(): void {
        this.checkHealth();
    }

    checkHealth(): void {
        this.checkingApi = true;
        this.errorMessage = '';

        this.triwebApiService.getMlHealth().subscribe({
            next: (res) => {
                this.apiStatus = res;
                this.checkingApi = false;
                this.errorMessage = '';
            },
            error: (err) => {
                this.apiStatus = null;
                this.checkingApi = false;
                this.errorMessage =
                    err?.message ||
                    'FastAPI ML non connectée. Vérifie /api/ml-models/health.';
            }
        });
    }

    predict(): void {
        this.loading = true;
        this.errorMessage = '';
        this.result = null;
        this.planningRiskResult = null;

        this.triwebApiService.predictPlanningRisk(this.form).subscribe({
            next: (res) => {
                this.result = res;
                this.planningRiskResult = res;
                this.loading = false;
            },
            error: (error) => {
                this.loading = false;
                this.errorMessage = 'Erreur lors de la prédiction.';
                console.error(error);
            }
        });
    }

    getRiskClass(level?: string): string {
        const value = (level || '').toLowerCase();

        if (
            value.includes('élevé') ||
            value.includes('eleve') ||
            value.includes('high')
        ) {
            return 'text-red-600';
        }

        if (
            value.includes('moyen') ||
            value.includes('moyenne') ||
            value.includes('medium')
        ) {
            return 'text-orange-500';
        }

        if (
            value.includes('faible') ||
            value.includes('low')
        ) {
            return 'text-green-600';
        }

        return 'text-secondary';
    }

    getAssignmentClass(score?: number): string {
        if (score === undefined || score === null) {
            return 'text-secondary';
        }

        if (score >= 75) {
            return 'text-green-600';
        }

        if (score >= 50) {
            return 'text-orange-500';
        }

        return 'text-red-600';
    }

    resetForm(): void {
        this.result = null;
        this.errorMessage = '';
        this.form = this.getDefaultForm();
    }

    getScoreClass(): string {
        const score = Number(this.result?.affectation?.score_affectation || 0);

        if (score >= 70) {
            return 'text-green-600';
        }

        if (score >= 45) {
            return 'text-orange-500';
        }

        return 'text-red-600';
    }

    getApiStatusLabel(): string {
        return this.apiStatus
            ? 'FastAPI ML connectée'
            : 'FastAPI ML non connectée';
    }

    private getDefaultForm(): MlPredictionRequest {
        return {
            position: 'Production',
            statut: 'En cours',
            loiType: 'production_standard',
            nature: 'Site - LocalVisibilité',

            etatR: 'En cours',
            etatG: 'En cours',
            etatCqi: '',
            etatCqc: '',

            teamR: '',
            teamG: '',

            page: 5,
            charge: 8,
            totalHours: 8,

            dureeRMin: 0,
            dureeGMin: 0,
            dureeCqiMin: 0,
            dureeCqcMin: 0,

            joursRestants: 1
        };
    }
}