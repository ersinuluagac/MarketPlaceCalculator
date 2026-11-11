// Monetary arithmetic uses kuruş. VAT-exclusive tariff entries are the invoiced bases.
const cents = value => Math.round(value * 100);
const amount = value => (value / 100).toFixed(2);

function charge(net, multiplier) {
  const gross = Math.round(net * multiplier / 100);
  return { net, gross, vat: gross - net };
}

export function calculateNetProfit(
  salePrice, commissionRate, productCost, productVatRate, shippingCompany, volumetricWeight, consts,
) {
  const sale = cents(salePrice);
  const productMultiplier = Math.round(productVatRate * 100);
  const serviceMultiplier = Math.round(consts.taxMultiplier * 100);
  const invoiceNet = Math.round(sale * 100 / productMultiplier);
  const saleVat = sale - invoiceNet;
  const product = charge(cents(productCost), productMultiplier);

  // The entered rate includes service VAT and applies to the gross sale price.
  const commissionBasisPoints = Math.round(commissionRate * 100);
  const commission = Math.round(sale * commissionBasisPoints / 10000);
  const commissionNet = Math.round(commission * 100 / serviceMultiplier);
  const commissionVat = commission - commissionNet;

  const usesDesi = sale >= 35000 || volumetricWeight > 10;
  const tier = sale < 20000 ? 0 : 1;
  const shippingType = usesDesi ? "Normal" : ["Alt Barem", "Üst Barem"][tier];
  const standardShipping = charge(cents(usesDesi
    ? shippingCompany.prices[volumetricWeight] : shippingCompany.shippingTierNormal[tier]), serviceMultiplier);
  const fastShipping = usesDesi ? standardShipping : charge(cents(shippingCompany.shippingTierFast[tier]), serviceMultiplier);
  const standardFee = charge(cents(consts.transactionFeeTierNormal), serviceMultiplier);
  const todayFee = charge(cents(consts.transactionFeeTierFast), serviceMultiplier);

  const result = {
    salePrice, commissionRate, shippingType,
    invoiceNet: amount(invoiceNet), vatSale: amount(saleVat),
    fullProductCost: amount(product.gross), vatProduct: amount(product.vat),
    fullCommissionCost: commission / 100, vatCommission: amount(commissionVat),
    fullNormalShippingCost: amount(standardShipping.gross), vatNormalShipping: amount(standardShipping.vat),
    fullFastShippingCost: amount(fastShipping.gross), vatFastShipping: amount(fastShipping.vat),
    fullNormalTransactionCost: amount(standardFee.gross), vatNormalTransaction: amount(standardFee.vat),
    fullFastTransactionCost: amount(todayFee.gross), vatFastTransaction: amount(todayFee.vat)
  };

  function setScenario(mode, shipping, fee) {
    const payout = sale - commission - shipping.gross - fee.gross;
    const profit = invoiceNet - commissionNet - shipping.net - fee.net - product.net;
    result["amountToDeposited" + mode] = amount(payout);
    result["totalVat" + mode] = amount(saleVat - commissionVat - shipping.vat - fee.vat - product.vat);
    result["netProfit" + mode] = amount(profit);
    result["profitMargin" + mode] = (profit * 100 / sale).toFixed(2);
    result["roi" + mode] = product.gross ? (profit * 100 / product.gross).toFixed(2) : null;
  }
  setScenario("Normal", standardShipping, standardFee);
  setScenario("Fast", fastShipping, standardFee);
  setScenario("Today", fastShipping, todayFee);
  return result;
}
