interface AppFooterProps {
  onFeatureInDevelopment: (message: string) => void;
}

export default function AppFooter({ onFeatureInDevelopment }: AppFooterProps) {
  return (
    <footer className="hidden md:flex w-full bg-white py-8 px-12 justify-between items-center border-t border-[#bbcabf]/20 mt-12">
      <p className="text-sm text-[#3c4a42] font-semibold">© 2026 VietFood AI - Chuyên gia dinh dưỡng số</p>
      <div className="flex gap-6">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onFeatureInDevelopment('Tính năng giới thiệu đang phát triển');
          }}
          className="text-sm text-[#3c4a42] hover:text-[#006c49] font-bold hover:underline transition-all"
        >
          Về chúng tôi
        </a>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onFeatureInDevelopment('Điều khoản đang phát triển');
          }}
          className="text-sm text-[#3c4a42] hover:text-[#006c49] font-bold hover:underline transition-all"
        >
          Điều khoản
        </a>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onFeatureInDevelopment('Tính năng liên hệ đang phát triển');
          }}
          className="text-sm text-[#3c4a42] hover:text-[#006c49] font-bold hover:underline transition-all"
        >
          Liên hệ
        </a>
      </div>
    </footer>
  );
}
