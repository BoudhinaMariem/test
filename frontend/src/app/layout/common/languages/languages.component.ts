import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { take } from 'rxjs/operators';
import { TranslocoService } from '@ngneat/transloco';
import { FuseNavigationService, FuseVerticalNavigationComponent } from '@fuse/components/navigation';

@Component({
    selector       : 'languages',
    templateUrl    : './languages.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    exportAs       : 'languages'
})
export class LanguagesComponent implements OnInit, OnDestroy
{
    availableLangs: any[] = [];
    activeLang: string = 'en';

    flagCodes: { [key: string]: string } = {
        en: 'US',
        fr: 'FR'
    };

    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseNavigationService: FuseNavigationService,
        private _translocoService: TranslocoService
    )
    {
    }

    ngOnInit(): void
    {
        this.availableLangs = this._translocoService.getAvailableLangs() as any[];

        this._translocoService.langChanges$.subscribe((activeLang: string) => {
            this.activeLang = activeLang;
            this._updateNavigation(activeLang);
            this._changeDetectorRef.markForCheck();
        });
    }

    ngOnDestroy(): void
    {
    }

    setActiveLang(lang: string): void
    {
        this._translocoService.setActiveLang(lang);
    }

    trackByFn(index: number, item: any): any
    {
        return item?.id || item || index;
    }

    private _updateNavigation(lang: string): void
    {
        const navComponent = this._fuseNavigationService.getComponent<FuseVerticalNavigationComponent>('mainNavigation');

        if ( !navComponent )
        {
            return;
        }

        const navigation = navComponent.navigation;

        const projectDashboardItem = this._fuseNavigationService.getItem('dashboards.project', navigation);
        if ( projectDashboardItem )
        {
            this._translocoService.selectTranslate('Project').pipe(take(1))
                .subscribe((translation: string) => {
                    projectDashboardItem.title = translation;
                    navComponent.refresh();
                });
        }

        const analyticsDashboardItem = this._fuseNavigationService.getItem('dashboards.analytics', navigation);
        if ( analyticsDashboardItem )
        {
            this._translocoService.selectTranslate('Analytics').pipe(take(1))
                .subscribe((translation: string) => {
                    analyticsDashboardItem.title = translation;
                    navComponent.refresh();
                });
        }
    }
}