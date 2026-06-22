import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { take } from 'rxjs/operators';
import { TranslocoService } from '@ngneat/transloco';
import { FuseNavigationService, FuseVerticalNavigationComponent } from '@fuse/components/navigation';
import { NavigationService } from 'app/core/navigation/navigation.service';

@Component({
    selector       : 'languages',
    templateUrl    : './languages.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    exportAs       : 'languages',
    styles         : [`
        .lang-flags-row {
            height: 40px;
        }

        .lang-flag-btn {
            display: inline-flex !important;
            align-items: flex-end !important;
            justify-content: center !important;
            width: 40px !important;
            height: 40px !important;
            padding: 0 0 10px !important;
        }

        .lang-flag-btn .lang-flag-wrap {
            position: relative;
            display: block;
            width: 28px;
            height: 20px;
            flex-shrink: 0;
            transition: opacity 0.15s ease, box-shadow 0.15s ease;
        }

        .lang-flag-btn:not(.lang-active) .lang-flag-wrap {
            opacity: 0.45;
        }

        .lang-flag-btn:not(.lang-active):hover .lang-flag-wrap {
            opacity: 0.85;
        }

        .lang-flag-btn.lang-active .lang-flag-wrap {
            opacity: 1;
            box-shadow: 0 0 0 2px #9C0F48;
        }
    `]
})
export class LanguagesComponent implements OnInit, OnDestroy
{
    availableLangs: any[] = [];
    activeLang: string = 'fr';

    flagCodes: { [key: string]: string } = {
        en: 'US',
        fr: 'FR'
    };

    private readonly _legacyNavKeys: Array<{ id: string; key: string }> = [
        { id: 'dashboards.project', key: 'Project' },
        { id: 'dashboards.analytics', key: 'Analytics' }
    ];

    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseNavigationService: FuseNavigationService,
        private _navigationService: NavigationService,
        private _translocoService: TranslocoService
    )
    {
    }

    ngOnInit(): void
    {
        this.availableLangs = this._translocoService.getAvailableLangs() as any[];
        this.activeLang = this._translocoService.getActiveLang();

        this._translocoService.langChanges$.subscribe((activeLang: string) => {
            this.activeLang = activeLang;
            this._updateLegacyNavigation(activeLang);
            this._navigationService.get().pipe(take(1)).subscribe();
            this._changeDetectorRef.markForCheck();
        });
    }

    ngOnDestroy(): void
    {
    }

    setActiveLang(lang: string): void
    {
        if (lang === this.activeLang)
        {
            return;
        }

        this._translocoService.setActiveLang(lang);
    }

    trackByFn(index: number, item: any): any
    {
        return item?.id || item || index;
    }

    private _updateLegacyNavigation(lang: string): void
    {
        const navComponent = this._fuseNavigationService.getComponent<FuseVerticalNavigationComponent>('mainNavigation');

        if (!navComponent)
        {
            return;
        }

        const navigation = navComponent.navigation;

        this._legacyNavKeys.forEach(({ id, key }) => {
            const item = this._fuseNavigationService.getItem(id, navigation);

            if (item)
            {
                this._translocoService.selectTranslate(key).pipe(take(1))
                    .subscribe((translation: string) => {
                        item.title = translation;
                        navComponent.refresh();
                    });
            }
        });
    }
}
