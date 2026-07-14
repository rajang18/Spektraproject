import { Type } from "@angular/core";
import { BillAndPayPaymentGatewayComponent } from "../bill-and-pay-payment-gateway/bill-and-pay-payment-gateway.component";
import { EziDebitComponent } from "../ezi-debit/ezi-debit.component";
import { MCBComponent } from "../mcb/mcb.component";
import { NoProviderComponent } from "../no-provider/no-provider.component";
import { StripeComponent } from "../stripe/stripe.component";
import { UnknownComponent } from "../unknown/unknown.component";
import { AuthorizeNetComponent } from "../authorize-net/authorize-net.component";


export enum PaymentMode{
    billandpay='billandpay',
    ezidebit='ezidebit',
    mcb='mcb',
    noprovider='noprovider',
    stripe='stripe',
    unknown='unknown',
    authorizenet = 'authorize.net'
}


export const ManagePaymentWidgetMap = new Map<string, Type<any>>([
    [PaymentMode.billandpay, BillAndPayPaymentGatewayComponent],
    [PaymentMode.ezidebit, EziDebitComponent],
    [PaymentMode.mcb, MCBComponent],
    [PaymentMode.noprovider, NoProviderComponent],
    [PaymentMode.stripe, StripeComponent],
    [PaymentMode.unknown, UnknownComponent],
    [PaymentMode.authorizenet, AuthorizeNetComponent],

])

