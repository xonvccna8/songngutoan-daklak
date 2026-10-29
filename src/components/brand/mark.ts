// Hình bên trong logo (khung 40×40, chưa có nền): dấu cộng · tam giác vuông · số π · đường tròn có bán kính.
// Dùng chung cho LogoMark (giao diện) và /icons/[name] (biểu tượng PWA) để hai nơi luôn giống nhau.
export const LOGO_BG = "#14213D";

export const LOGO_MARK =
  // Dấu cộng (trên trái) — Số và Đại số
  '<path d="M12 7 V17 M7 12 H17" stroke="#FFC93C" stroke-width="3" stroke-linecap="round"/>' +
  // Tam giác vuông (trên phải) — Hình học
  '<path d="M23.5 17.5 V7 L33.5 17.5 Z" fill="#FF7A5C" stroke="#FF7A5C" stroke-width="1.4" stroke-linejoin="round"/>' +
  '<path d="M23.5 14.6 H26.4 V17.5" stroke="#14213D" stroke-width="1.1" fill="none"/>' +
  // Số π (dưới trái)
  '<path d="M6.5 24.5 H17.5 M9.6 24.5 C9.6 28.5 9 31.5 7.6 33.2 M14.4 24.5 V31.6 C14.4 33 15.6 33.6 17 32.6" stroke="#4CC9DB" stroke-width="2.3" fill="none" stroke-linecap="round"/>' +
  // Đường tròn có bán kính (dưới phải) — Đo lường
  '<circle cx="28.5" cy="28.5" r="5.4" fill="none" stroke="#86EFAC" stroke-width="2.2"/>' +
  '<path d="M28.5 28.5 L32.3 24.7" stroke="#86EFAC" stroke-width="1.6" stroke-linecap="round"/>' +
  '<circle cx="28.5" cy="28.5" r="1.4" fill="#86EFAC"/>';
