import { Route } from '@angular/router';
import { AuthGuard } from 'app/core/auth/guards/auth.guard';
import { NoAuthGuard } from 'app/core/auth/guards/noAuth.guard';
import { LayoutComponent } from 'app/layout/layout.component';
import { InitialDataResolver } from 'app/app.resolvers';

export const appRoutes: Route[] = [
    { path: '', pathMatch: 'full', redirectTo: 'triweb/dashboard' },
    { path: 'signed-in-redirect', pathMatch: 'full', redirectTo: 'triweb/dashboard' },
    {
        path: '',
        canActivate: [NoAuthGuard],
        canActivateChild: [NoAuthGuard],
        component: LayoutComponent,
        data: { layout: 'empty' },
        children: [
            { path: 'confirmation-required', loadChildren: () => import('app/modules/auth/confirmation-required/confirmation-required.module').then(m => m.AuthConfirmationRequiredModule) },
            { path: 'forgot-password', loadChildren: () => import('app/modules/auth/forgot-password/forgot-password.module').then(m => m.AuthForgotPasswordModule) },
            { path: 'reset-password', loadChildren: () => import('app/modules/auth/reset-password/reset-password.module').then(m => m.AuthResetPasswordModule) },
            { path: 'sign-in', loadChildren: () => import('app/modules/auth/sign-in/sign-in.module').then(m => m.AuthSignInModule) },
            { path: 'sign-up', loadChildren: () => import('app/modules/auth/sign-up/sign-up.module').then(m => m.AuthSignUpModule) }
        ]
    },
    {
        path: '',
        canActivate: [AuthGuard],
        canActivateChild: [AuthGuard],
        component: LayoutComponent,
        data: { layout: 'empty' },
        children: [
            { path: 'sign-out', loadChildren: () => import('app/modules/auth/sign-out/sign-out.module').then(m => m.AuthSignOutModule) },
            { path: 'unlock-session', loadChildren: () => import('app/modules/auth/unlock-session/unlock-session.module').then(m => m.AuthUnlockSessionModule) }
        ]
    },
    {
        path: '',
        component: LayoutComponent,
        data: { layout: 'empty' },
        children: [
            { path: 'home', loadChildren: () => import('app/modules/landing/home/home.module').then(m => m.LandingHomeModule) },
        ]
    },
    {
        path: '',
        canActivate: [AuthGuard],
        canActivateChild: [AuthGuard],
        component: LayoutComponent,
        resolve: { initialData: InitialDataResolver },
        children: [
            {
                path: 'triweb', children: [
                    { path: 'dashboard', loadChildren: () => import('app/modules/admin/triweb/dashboard/dashboard.module').then(m => m.TriwebDashboardModule) },
                    //{ path: 'production', loadChildren: () => import('app/modules/admin/triweb/production/production.module').then(m => m.TriwebProductionModule) },
                    //{ path: 'performance', loadChildren: () => import('app/modules/admin/triweb/performance/performance.module').then(m => m.TriwebPerformanceModule) },
                    { path: 'planification', loadChildren: () => import('app/modules/admin/triweb/planification/planification.module').then(m => m.TriwebPlanificationModule) },
                    //{ path: 'disponibilite', loadChildren: () => import('app/modules/admin/triweb/disponibilite/disponibilite.module').then(m => m.TriwebDisponibiliteModule) },
                    { path: 'models', loadChildren: () => import('app/modules/admin/triweb/models/models.module').then(m => m.TriwebModelsModule) },                    
                    { path: 'powerbi', loadChildren: () => import('app/modules/admin/triweb/powerbi/powerbi.module').then(m => m.TriwebPowerbiModule) }            
                ]
            },
            { path: '404-not-found', pathMatch: 'full', loadChildren: () => import('app/modules/admin/pages/error/error-404/error-404.module').then(m => m.Error404Module) },
            { path: '**', redirectTo: '404-not-found' }
        ]
    }
];
