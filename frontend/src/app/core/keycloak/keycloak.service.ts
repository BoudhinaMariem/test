import { Injectable } from '@angular/core';
import * as Keycloak from 'keycloak-js';

@Injectable({
    providedIn: 'root'
})
export class KeycloakService {
    private _keycloak: any;

    constructor() {
        const keycloakFactory = (Keycloak as any).default || Keycloak;

        this._keycloak = keycloakFactory({
            url: 'http://localhost:8080',
            realm: 'TRIWEB',
            clientId: 'triweb-frontend'
        });
    }

    init(): Promise<boolean> {
        return this._keycloak.init({
            onLoad: 'check-sso',
            checkLoginIframe: false,
            flow: 'standard',
            pkceMethod: 'S256',
            enableLogging: true
        } as any)
        .then((authenticated: boolean) => {
            console.log('Keycloak authenticated:', authenticated);
            return authenticated;
        })
        .catch((error: any) => {
            console.error('Keycloak init error:', error);
            return false;
        });
    }

    login(): Promise<void> {
        return this._keycloak.login({
            redirectUri: 'http://localhost:4200/triweb/dashboard'
        });
    }

    logout(): Promise<void> {
        return this._keycloak.logout({
            redirectUri: 'http://localhost:4200/sign-in'
        });
    }

    isAuthenticated(): boolean {
        return !!this._keycloak.authenticated;
    }

    getUsername(): string {
        return this._keycloak.tokenParsed?.preferred_username || '';
    }

    getRoles(): string[] {
        const realmAccess = this._keycloak.tokenParsed?.realm_access;
        return realmAccess?.roles || [];
    }

    hasRole(role: string): boolean {
        return this.getRoles().includes(role);
    }

    async getToken(): Promise<string | undefined> {
        if (!this._keycloak.authenticated) {
            return undefined;
        }

        try {
            await this._keycloak.updateToken(30);
            return this._keycloak.token;
        } catch (error) {
            console.error('Keycloak token refresh error:', error);
            return undefined;
        }
    }
}

export function initializeKeycloak(keycloakService: KeycloakService): () => Promise<boolean> {
    return () => keycloakService.init();
}