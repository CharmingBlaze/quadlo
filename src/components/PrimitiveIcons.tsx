import type { ReactElement } from 'react'
import {
  IconBox,
  IconCapsule,
  IconCircleHalf,
  IconCone,
  IconCylinder,
  IconHemisphere,
  IconOctahedron,
  IconPyramid,
  IconSphere,
  IconStairs,
  IconStar,
} from '@tabler/icons-react'
import type { IconProps } from '@tabler/icons-react'
import type { PrimitiveKind } from '../store/appStore'
import ringSvg from '../assets/icons/primitives/ring.svg?raw'
import torusSvg from '../assets/icons/primitives/torus.svg?raw'

const ICON_PROPS: IconProps = {
  size: 18,
  stroke: 1.75,
  className: 'primitive-icon',
}

function VendoredSvgIcon({ svg }: { svg: string }) {
  return (
    <span
      className="primitive-icon primitive-icon-vendored"
      aria-hidden
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

const ICONS: Record<Exclude<PrimitiveKind, 'roundedBox'>, () => ReactElement> = {
  box: () => <IconBox {...ICON_PROPS} />,
  icosphere: () => <IconOctahedron {...ICON_PROPS} />,
  sphere: () => <IconSphere {...ICON_PROPS} />,
  cone: () => <IconCone {...ICON_PROPS} />,
  cylinder: () => <IconCylinder {...ICON_PROPS} />,
  capsule: () => <IconCapsule {...ICON_PROPS} />,
  pyramid: () => <IconPyramid {...ICON_PROPS} />,
  doughnut: () => <VendoredSvgIcon svg={torusSvg} />,
  ring: () => <VendoredSvgIcon svg={ringSvg} />,
  stairs: () => <IconStairs {...ICON_PROPS} />,
  star: () => <IconStar {...ICON_PROPS} />,
  dome: () => <IconHemisphere {...ICON_PROPS} />,
  halfCircle: () => <IconCircleHalf {...ICON_PROPS} />,
}

export function PrimitiveIcon({ kind }: { kind: PrimitiveKind }) {
  const resolved = kind === 'roundedBox' ? 'box' : kind
  const Icon = ICONS[resolved]
  return <Icon />
}
