# Open Brands

A list of brands with their respective logos and colors. A package to easily include these in any project. 

Go through the list, or use any of the functions. 

Find all available logos on [open-brands.org](www.open-brands.org)


### Installation

```bash
npm install open-brands
```

### Helpers

```js
const silBrandData = getBrand('Sil');

// Result

const silBrandData = {
    name: "sil",
    title: "Sil",
    description: "A description of the brand",
    color: ['#000000','#FFFFFFF','#2325af'],
    urls: {
        default: 'sil.svg',
        icon: 'sil_icon.svg',
        wordmark: 'sil_wordmark',
        normal: 'sil.svg'
    },
    data: {
        default: '<svg .... /svg>',
        icon:  '<svg .... /svg>',
        wordmark:  '<svg .... /svg>',
        normal:  '<svg .... /svg>',
    }
}

```

