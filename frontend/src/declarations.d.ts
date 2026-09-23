declare module 'lucide-react' {
  import * as React from 'react';
  export interface IconProps extends React.SVGProps<SVGSVGElement> {
    size?: string | number;
    color?: string;
    strokeWidth?: string | number;
  }
  export type Icon = React.FC<IconProps>;
  export const Activity: Icon;
  export const ShieldCheck: Icon;
  export const Box: Icon;
  export const RefreshCw: Icon;
  export const Layers: Icon;
  export const Package: Icon;
  export const CheckCircle2: Icon;
  export const CheckCircle: Icon;
  export const XCircle: Icon;
  export const AlertTriangle: Icon;
  export const AlertCircle: Icon;
  export const TrendingUp: Icon;
  export const Camera: Icon;
  export const User: Icon;
  export const MapPin: Icon;
  export const Clock: Icon;
  export const Wifi: Icon;
  export const FileSpreadsheet: Icon;
  export const Lock: Icon;
  export const Eye: Icon;
  export const Check: Icon;
  export const Search: Icon;
  export const BrainCircuit: Icon;
  export const Cpu: Icon;
  export const Barcode: Icon;
  export const FileText: Icon;
  export const Sparkles: Icon;
  export const HelpCircle: Icon;
  export const ShieldAlert: Icon;
  export const ArrowRight: Icon;
  export const Key: Icon;
  export const FileCode: Icon;
  export const Database: Icon;
  export const UserCheck: Icon;
  export const ExternalLink: Icon;
  const icons: Record<string, Icon>;
  export default icons;
}
