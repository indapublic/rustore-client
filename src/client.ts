import axios from 'axios';

import { RSAuth } from './auth';
import {
  RS_Purchace,
  RS_SubscriptionResponse_Body,
  RS_SubscriptionState,
} from './interfaces';
import { API_URL, Path } from './constants';
import { RuStoreError } from './errors';
import { TBaseResponse, TErrorResponse } from './types';

export class RuStoreClient {
  private readonly auth: RSAuth;
  private readonly httpClient = axios.create({ baseURL: API_URL });

  constructor(privateKey: string, companyId: number) {
    this.auth = new RSAuth(privateKey, companyId);
  }

  public init() {
    return this.auth.auth();
  }

  public async getPurchase(purchaseToken: string): Promise<RS_Purchace> {
    const result = await this.request<TBaseResponse<RS_Purchace>>(
      `${Path.Purchase}${purchaseToken}`,
    );

    return result.body;
  }

  public async getSandboxPurchase(purchaseToken: string): Promise<RS_Purchace> {
    const result = await this.request<TBaseResponse<RS_Purchace>>(
      `${Path.SandboxPurchase}${purchaseToken}`,
    );

    return result.body;
  }

  public async getSubscription(
    purchaseToken: string,
  ): Promise<RS_SubscriptionResponse_Body> {
    const result = await this.request<
      TBaseResponse<RS_SubscriptionResponse_Body>
    >(`${Path.Subscription}${purchaseToken}`);

    return result.body;
  }

  public async isSubscriptionActive(purchaseToken: string): Promise<boolean> {
    const result = await this.request<TBaseResponse<RS_SubscriptionState>>(
      `${Path.Subscription}${purchaseToken}/state`,
    );

    return result.body.is_active;
  }

  public async getVersion(
    packageName: string,
    ids: number | undefined = undefined,
    page = 0,
    size = 20,
  ): Promise<void> {
    const result = await this.request<
      TBaseResponse<Record<string, any> | undefined>
    >(`${Path.Version}${packageName}/version`, {
      ids,
      page,
      size,
    });

    console.log(result);
  }

  private async request<T>(path: string, params?: any) {
    try {
      const jwe = await this.auth.getJwe();
      const paramsQuery = params ? new URLSearchParams(params) : null;

      const result = await this.httpClient.get<T>(
        path + (paramsQuery ? paramsQuery.toString() : ''),
        {
          headers: { 'Public-Token': jwe },
        },
      );

      return result.data;
    } catch (e: any) {
      const data = e.response.data as TErrorResponse | '';

      if (!data) {
        throw new RuStoreError({
          code: 'ERROR',
          message: e.response.statusText,
          timestamp: '',
        });
      }

      throw new RuStoreError(data);
    }
  }
}
