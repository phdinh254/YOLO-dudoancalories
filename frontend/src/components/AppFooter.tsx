interface AppFooterProps {
  onFeatureInDevelopment: (message: string) => void;
}

export default function AppFooter({ onFeatureInDevelopment }: AppFooterProps) {
  return (
    <footer className="hidden md:flex w-full bg-white py-8 px-12 justify-between items-center border-t border-outline-variant/20 mt-12">
      <p className="text-sm text-on-surface-variant font-semibold">© 2026 VietFood AI - Trợ lý ước tính calo bằng AI</p>
      <div className="flex gap-6">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onFeatureInDevelopment('Tính năng giới thiệu đang phát triển');
          }}
          className="text-sm text-on-surface-variant hover:text-primary font-bold hover:underline transition-all"
        >
          Về chúng tôi
        </a>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onFeatureInDevelopment('Điều khoản đang phát triển');
          }}
          className="text-sm text-on-surface-variant hover:text-primary font-bold hover:underline transition-all"
        >
          Điều khoản
        </a>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onFeatureInDevelopment('Tính năng liên hệ đang phát triển');
          }}
          className="text-sm text-on-surface-variant hover:text-primary font-bold hover:underline transition-all"
        >
          Liên hệ
        </a>
      </div>
    </footer>
  );
}
