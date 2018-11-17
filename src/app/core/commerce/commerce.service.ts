import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Category } from '@cxcloud/ct-types/categories';
import { PaginatedProductResult, Product } from '@cxcloud/ct-types/products';
import { ShippingMethod } from '@cxcloud/ct-types/shipping';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { sortByCustomValues, getApiUrl } from '../../utils/helpers';
import { ServiceAlias } from '../../types/services';

@Injectable()
export class CommerceService {
  readonly apiUrl = getApiUrl(ServiceAlias.Commerce);

  constructor(private http: HttpClient) {}

  getCategories(): Observable<Category[]> {
    return this.http
      .get<Category[]>(`${this.apiUrl}/categories`)
      .pipe(tap(categories => this.sortCategories(categories)));
  }

  getProducts(categoryId: string): Observable<PaginatedProductResult> {
    return this.http.get<PaginatedProductResult>(
      `${this.apiUrl}/products/byCategoryId/${categoryId}`
    );
  }

  getProduct(productId: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/products/${productId}`);
  }

  getShippingMethods(): Observable<ShippingMethod[]> {
    return this.http.get<ShippingMethod[]>(`${this.apiUrl}/shipping/methods`);
  }

  sortCategories(categories) {
    const order = [
      'clothing',
      'shoes',
      'bags',
      'looks',
      'women',
      'men',
      'special',
      'accessories',
      'new',
      'brands',
      'sale'
    ];
    // Sort categories and sub categories by given order
    sortByCustomValues(categories, order, 'name.en');

    categories.forEach(category => {
      if (category.hasOwnProperty('subCategories')) {
        this.sortCategories(category.subCategories);
      }
    });
  }
}
