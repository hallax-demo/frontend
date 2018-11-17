import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {
  AnonymousSignInResult,
  CustomerSignupDraft,
  TokenizedSignInResult
} from '@cxcloud/ct-types/customers';
import { LocalStorageService } from 'ngx-webstorage';
import { map, tap } from 'rxjs/operators';
import { CartService } from '../cart/cart.service';
import { CurrentUserService } from './current-user.service';
import { getApiUrl } from '../../utils/helpers';
import { ServiceAlias } from '../../types/services';

@Injectable()
export class AuthService {
  readonly apiUrl = getApiUrl(ServiceAlias.Auth);

  constructor(
    private http: HttpClient,
    private storage: LocalStorageService,
    private currentUserService: CurrentUserService,
    private cartService: CartService,
    private router: Router
  ) {
    this.checkAccessToken();
  }

  get currentTime() {
    return Math.floor(new Date().getTime() / 1000);
  }

  checkAccessToken() {
    const token = this.storage.retrieve('token');
    const customer = this.storage.retrieve('customer');
    const expiredAt = this.storage.retrieve('expired_at');

    // anonymous user: if token is expired or token does't exist
    if ((token && expiredAt <= this.currentTime) || !token) {
      // Update LS values
      this.loginAnonymously();
    }
    // logged in user: if token is expired
    if (customer && expiredAt <= this.currentTime) {
      this.logout();
    }
  }

  private loginAnonymously() {
    this.http
      .post<AnonymousSignInResult>(`${this.apiUrl}/login/anonymous`, {})
      .subscribe(result => {
        this.currentUserService.token.next(result.token);
        this.currentUserService.customer.next(null);
        this.currentUserService.expiredAt.next(
          this.currentTime + result.token['expires_in']
        );
      });
  }

  private handleSignIn(resp: TokenizedSignInResult) {
    this.currentUserService.customer.next(resp.customer);
    this.currentUserService.token.next(resp.token);
    this.cartService.cart.next(resp.cart);
    this.currentUserService.expiredAt.next(
      this.currentTime + resp.token['expires_in']
    );
  }

  public login(username: string, password: string) {
    return this.http
      .post<TokenizedSignInResult>(`${this.apiUrl}/login`, {
        username,
        password
      })
      .pipe(
        tap(resp => this.handleSignIn(resp)),
        map(resp => resp.customer)
      );
  }

  public register(draft: CustomerSignupDraft) {
    return this.http
      .post<TokenizedSignInResult>(`${this.apiUrl}/register`, draft)
      .pipe(
        tap(resp => this.handleSignIn(resp)),
        map(resp => resp.customer)
      );
  }

  public logout() {
    this.loginAnonymously();
    this.router.navigateByUrl('/user/login');
  }
}
