---
title: "Multiple Image Layout Demo"
description: A demonstration of horizontal image layout effects with different numbers of images, showcasing automatic column distribution and responsive design.
tags:
  - Demo
  - Layout
  - Images
pubDate: 2025-07-13
---

This page demonstrates the multiple image layout feature that automatically arranges images in columns based on the number of images in a group. The layout is responsive and adapts to different screen sizes.

## Usage Rules

Images can be separated by line breaks, but not by empty lines. The CSS will automatically adjust the column count based on the number of `<img>` tags within a `<p>` element.

For example:

```markdown
![](image1.jpg)
![](image2.jpg)
![](image3.jpg)
```

## Demo Examples

### Two Images

![](https://cn.bing.com/th?id=OHR.SessileOaks_EN-US1487454928_1280x768.jpg)
![](https://cn.bing.com/th?id=OHR.InscriptionWall_EN-US1392173431_1280x768.jpg)

### Three Images

![](https://cn.bing.com/th?id=OHR.DonkeyFeast_EN-US1153850805_1280x768.jpg)
![](https://cn.bing.com/th?id=OHR.RumeliHisari_EN-US4800002879_1280x768.jpg)
![](https://cn.bing.com/th?id=OHR.BisonWindCave_EN-US4537340482_1280x768.jpg)

### Four Images

![](https://cn.bing.com/th?id=OHR.Umschreibung_EN-US4693850900_768x1280.jpg)
![](https://cn.bing.com/th?id=OHR.HummockIce_EN-US4606231645_768x1280.jpg)
![](https://cn.bing.com/th?id=OHR.DonkeyFeast_EN-US1153850805_768x1280.jpg)
![](https://cn.bing.com/th?id=OHR.Breckenridge_EN-US4460042968_768x1280.jpg)

### Mixed Landscape and Portrait Images

This layout handles mixed orientations gracefully, though column heights may vary:

![](https://cn.bing.com/th?id=OHR.Breckenridge_EN-US4460042968_768x1280.jpg)
![](https://cn.bing.com/th?id=OHR.BisonWindCave_EN-US4537340482_1280x768.jpg)
![](https://cn.bing.com/th?id=OHR.Umschreibung_EN-US4693850900_768x1280.jpg)
![](https://cn.bing.com/th?id=OHR.DonkeyFeast_EN-US1153850805_768x1280.jpg)
![](https://cn.bing.com/th?id=OHR.SessileOaks_EN-US1487454928_1280x768.jpg)
![](https://cn.bing.com/th?id=OHR.DonkeyFeast_EN-US1153850805_1280x768.jpg)
![](https://cn.bing.com/th?id=OHR.RumeliHisari_EN-US4800002879_1280x768.jpg)
![](https://cn.bing.com/th?id=OHR.InscriptionWall_EN-US1392173431_1280x768.jpg)
![](https://cn.bing.com/th?id=OHR.HummockIce_EN-US4606231645_768x1280.jpg)

## Features

- **Automatic Column Distribution**: Images are automatically arranged in 2-4 columns based on count
- **Responsive Design**: Layout adapts to mobile devices with single column on small screens
- **Mixed Orientations**: Handles both landscape and portrait images in the same group
- **Consistent Spacing**: Maintains uniform gaps between images and columns
- **Break Prevention**: Prevents images from breaking across columns