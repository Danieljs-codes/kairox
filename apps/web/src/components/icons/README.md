# SVG Icons

This directory contains SVG icons that are automatically converted to React components using `vite-plugin-svg-sprite`.

## Usage

1. Place your `.svg` files in this directory
2. Import them as React components:

```tsx
import Layers from '@/components/icons/layers.svg';

<Layers />
<Layers className="w-6 h-6 text-blue-500" />
```

## How It Works

- All SVG files in this directory are automatically converted to React components
- Components are type-safe with IDE autocomplete
- Icons are rendered as SVG sprites for optimal performance

## TypeScript Support

Type definitions are automatically provided. You'll get full autocomplete and type checking when importing SVG files.

## Example

```tsx
import Layers from '@/components/icons/layers.svg';
import Example from '@/components/icons/example.svg';

function MyComponent() {
  return (
    <div>
      <Layers className="w-8 h-8" />
      <Example className="w-6 h-6 text-red-500" />
    </div>
  );
}
```
