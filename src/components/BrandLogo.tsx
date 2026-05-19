import { ASSETS } from "../lib/assets";

type Props = {
  className?: string;
};

export function BrandLogo({ className }: Props) {
  const cls = className ? `brand-logo ${className}` : "brand-logo";
  return <img src={ASSETS.brandLogo} alt="" className={cls} width={44} height={44} />;
}
