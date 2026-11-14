// Fictional orders in the same column layout as the two Trendyol exports.
export function sampleReport() {
  const products = [
    ["Sipariş Numarası", "Stok Kodu", "Ürün Adı", "Adet", "Satış Tutarı", "Faturalanacak Tutar", "Sipariş Statüsü", "Barkod", "Sipariş Tarihi"],
    ["ORNEK-1", "RO-01", "Raf örtüsü", 2, 600, 600, "Teslim Edildi", "ORNEK-RO", "01.09.2026"],
    ["ORNEK-1", "CS-01", "Çekmece düzenleyici", 1, 300, 300, "Teslim Edildi", "ORNEK-CS", "01.09.2026"],
    ["ORNEK-2", "RO-01", "Raf örtüsü", 1, 300, 300, "İade Edildi", "ORNEK-RO", "04.09.2026"]
  ];
  const finances = [
    ["Sipariş No", "Net Tutar", "Gönderi Kargo Bedeli", "Platform Hizmet Bedeli", "Komisyon/Yurt Dışı Stok Destek Bedeli", "İade Kargo Bedeli", "Ülke", "Sipariş Statüsü", "İade", "İptal", "Ürün Adedi", "Sipariş Tutarı", "İndirim", "Ceza Bedeli", "Ödeme Yöntemi"],
    ["ORNEK-1", 696, -60, -9, -135, 0, "Türkiye", "Teslim Edildi", 0, 0, 3, 900, 0, 0, "Kredi Kartı"],
    ["ORNEK-2", -90, -42, -6, 0, -42, "Türkiye", "İade Edildi", -300, 0, 1, 300, 0, 0, "Kredi Kartı"]
  ];
  return {products: {rows: products, name: "Örnek siparişler"}, finances: {rows: finances, name: "Örnek finans kayıtları"}};
}
