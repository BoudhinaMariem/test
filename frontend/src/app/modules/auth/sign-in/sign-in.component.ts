import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertType } from '@fuse/components/alert';

const TRIWEB_DEV_ACCESS_TOKEN = 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJleHAiOjQxMDI0NDQ4MDAsImlhdCI6MTcwNDA2NzIwMCwic3ViIjoidHJpd2ViLWRldi1hZG1pbiJ9.';

@Component({
    selector     : 'auth-sign-in',
    templateUrl  : './sign-in.component.html',
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations
})
export class AuthSignInComponent implements OnInit
{
    alert: { type: FuseAlertType; message: string } = {
        type   : 'success',
        message: ''
    };

    signInForm!: FormGroup;
    showAlert = false;

    constructor(
        private _router: Router,
        private _formBuilder: FormBuilder
    )
    {
    }

    ngOnInit(): void
    {
        this.signInForm = this._formBuilder.group({
            email     : ['admin@triweb.com', [Validators.required, Validators.email]],
            password  : ['admin', [Validators.required]],
            rememberMe: [false]
        });
    }

    signIn(): void
    {
        if (this.signInForm.invalid)
        {
            this.signInForm.markAllAsTouched();
            return;
        }

        this.showAlert = false;

        const email = this.signInForm.get('email')?.value;
        const password = this.signInForm.get('password')?.value;

        if (email === 'admin@triweb.com' && password === 'admin')
        {
            localStorage.setItem('accessToken', TRIWEB_DEV_ACCESS_TOKEN);
            localStorage.setItem('user', JSON.stringify({
                email: email,
                name: 'Admin Triweb',
                role: 'admin'
            }));

            this._router.navigateByUrl('/triweb/dashboard');
        }
        else
        {
            this.alert = {
                type   : 'error',
                message: 'Wrong email or password'
            };

            this.showAlert = true;

            this.signInForm.patchValue({
                password: 'admin'
            });
        }
    }
}
