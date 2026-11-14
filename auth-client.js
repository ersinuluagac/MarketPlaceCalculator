const projectUrl = "https://uuiuondxieynhzjzfcis.supabase.co";
const publicKey = "sb_publishable_wWJjYdryJpsRQF0x3dSJHA_8wGfNUBV";
let clientPromise;

export function getAccountClient() {
  if (!clientPromise) {
    clientPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = new URL("./vendor/supabase-2.119.0.js", import.meta.url);
      script.onload = () => resolve(window.supabase.createClient(projectUrl, publicKey));
      script.onerror = () => reject(Error("Üyelik hizmeti yüklenemedi."));
      document.head.append(script);
    });
  }
  return clientPromise;
}

export function authError(error, action) {
  if (error.status === 429) return "Çok sık deneme yapıldı. Biraz sonra tekrar deneyin.";
  switch (error.code) {
    case "invalid_credentials": return "E-posta adresi veya şifre hatalı. İlk şifrenizi almak için “Şifremi unuttum”u seçebilirsiniz.";
    case "email_not_confirmed": return "Giriş için önce kayıt e-postasındaki bağlantıdan adresinizi doğrulayın.";
    case "weak_password": return "Bu şifre kabul edilmedi. Daha uzun, tahmin edilmesi zor bir şifre deneyin.";
    case "same_password": return "Yeni şifreniz önceki şifrenizden farklı olmalı.";
    case "reauthentication_needed": return "Şifreyi yenilemek için çıkış yapıp “Şifremi unuttum”u seçin.";
  }
  return {login: "Giriş yapılamadı.", signup: "Hesap oluşturulamadı.", reset: "Şifre sıfırlama e-postası gönderilemedi.",
    resend: "Doğrulama e-postası gönderilemedi.", update: "Şifre kaydedilemedi."}[action] + " Lütfen tekrar deneyin.";
}
