export class CardDetailsUtilities {
  getCardType(cardNumber: string): string | null {
    // Remove all spaces from the card number
    const sanitizedCardNumber = cardNumber.replace(/\s+/g, '');
  
    const cardPatterns = [
      { regEx: /^4[0-9]{12}(?:[0-9]{3})?$/, type: 'Visa' },
      { regEx: /^5[1-5][0-9]{14}$/, type: 'Mastercard' },
      { regEx: /^3[47][0-9]{13}$/, type: 'American Express' },
      { regEx: /^3(?:0[0-5]|[68][0-9])[0-9]{11}$/, type: 'Diners Club' },
      { regEx: /^6(?:011|5[0-9]{2}|4[4-9][0-9])[0-9]{12}$/, type: 'Discover' },
      { regEx: /^35(?:2[89]|[3-8][0-9])[0-9]{12}$/, type: 'JCB' },
      { regEx: /^62[0-5][0-9]{13,16}$/, type: 'UnionPay' },
      { regEx: /^9792[0-9]{12}$/, type: 'Troy' },
      { regEx: /^(5[06789][0-9]{0,2}|6[0-9]{1,3})[0-9]{8,15}$/, type: 'Maestro' },
      { regEx: /^600722[0-9]{10}$/, type: 'Forbrugsforeningen' },
      { regEx: /^5019[0-9]{12}$/, type: 'Dankort' },
      // ... other card patterns
    ];
  
    for (const pattern of cardPatterns) {
      if (pattern.regEx.test(sanitizedCardNumber)) {
        return pattern.type;
      }
    }
  
    return null;
  }
}