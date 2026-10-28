# 图像逐项制作清单

本清单由 tools/build_image_catalog.py 生成；规格status是原计划，intake_status是实际交付检查，入库不等于引擎验收。共213项，制作方式计数：{"new_draw": 137, "derived": 55, "engine": 16, "platform": 5}。

一项可能有多档尺寸，不能把导出档数当作新画数量。optional/candidate不属于必交；平台官方尺寸需实施时复核。

## spr_ing_sago_base · 西米团

- category: ingredient
- first_phase: P1
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 1024x1024 layered
- export_spec: 128x128;256x256;512x512 PNG
- runtime_du: visible diameter 36
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 半透明浅白珠团，三颗细亮点，浅灰边；主色参考#E6E1D5；左上45度柔光；主体中心(512,512)，基准主体半径460.8px，外廓与碰撞偏差≤8%；无大外投影；层分base/texture/highlight/optional_face。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: spr_ing_sago_base.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 3
- library_index: assets/library/index.html#spr_ing_sago_base

## ui_ing_sago_thumb · 西米团缩略图

- category: ingredient_thumbnail
- first_phase: P1
- required: required
- production_method: derived
- source_asset_id: spr_ing_sago_base
- source_spec: reuse spr_ing_sago_base
- export_spec: 96x96 PNG
- runtime_du: 48x48
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 从母版缩小后人工检查，必要时简化细纹；不改变材质和轮廓。
- color_space: sRGB
- status: planned
- license_status: inherits_source_or_code
- filename: ui_ing_sago_thumb.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#ui_ing_sago_thumb

## ui_ing_sago_locked · 西米团图鉴未发现剪影

- category: collection
- first_phase: P4-B
- required: required
- production_method: derived
- source_asset_id: spr_ing_sago_base
- source_spec: reuse spr_ing_sago_base
- export_spec: 192x192 PNG
- runtime_du: 96x96
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 原图alpha生成统一中性轮廓；问号为动态文字，不新增真实小料等级。
- color_space: sRGB
- status: deferred
- license_status: inherits_source_or_code
- filename: ui_ing_sago_locked.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#ui_ing_sago_locked

## ui_ing_sago_detail · 西米团图鉴详情图

- category: collection
- first_phase: P4-B
- required: required
- production_method: derived
- source_asset_id: spr_ing_sago_base
- source_spec: reuse spr_ing_sago_base
- export_spec: 512x512 PNG
- runtime_du: 256x256
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 直接使用母版导出，不重复绘制；详情名称/等级由程序排版。
- color_space: sRGB
- status: deferred
- license_status: inherits_source_or_code
- filename: ui_ing_sago_detail.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#ui_ing_sago_detail

## spr_ing_red_bean_base · 红豆团

- category: ingredient
- first_phase: P1
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 1024x1024 layered
- export_spec: 128x128;256x256;512x512 PNG
- runtime_du: visible diameter 48
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 酒红豆团，可见豆纹，不能画成普通棕球；主色参考#9E4453；左上45度柔光；主体中心(512,512)，基准主体半径460.8px，外廓与碰撞偏差≤8%；无大外投影；层分base/texture/highlight/optional_face。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: spr_ing_red_bean_base.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 3
- library_index: assets/library/index.html#spr_ing_red_bean_base

## ui_ing_red_bean_thumb · 红豆团缩略图

- category: ingredient_thumbnail
- first_phase: P1
- required: required
- production_method: derived
- source_asset_id: spr_ing_red_bean_base
- source_spec: reuse spr_ing_red_bean_base
- export_spec: 96x96 PNG
- runtime_du: 48x48
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 从母版缩小后人工检查，必要时简化细纹；不改变材质和轮廓。
- color_space: sRGB
- status: planned
- license_status: inherits_source_or_code
- filename: ui_ing_red_bean_thumb.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#ui_ing_red_bean_thumb

## ui_ing_red_bean_locked · 红豆团图鉴未发现剪影

- category: collection
- first_phase: P4-B
- required: required
- production_method: derived
- source_asset_id: spr_ing_red_bean_base
- source_spec: reuse spr_ing_red_bean_base
- export_spec: 192x192 PNG
- runtime_du: 96x96
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 原图alpha生成统一中性轮廓；问号为动态文字，不新增真实小料等级。
- color_space: sRGB
- status: deferred
- license_status: inherits_source_or_code
- filename: ui_ing_red_bean_locked.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#ui_ing_red_bean_locked

## ui_ing_red_bean_detail · 红豆团图鉴详情图

- category: collection
- first_phase: P4-B
- required: required
- production_method: derived
- source_asset_id: spr_ing_red_bean_base
- source_spec: reuse spr_ing_red_bean_base
- export_spec: 512x512 PNG
- runtime_du: 256x256
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 直接使用母版导出，不重复绘制；详情名称/等级由程序排版。
- color_space: sRGB
- status: deferred
- license_status: inherits_source_or_code
- filename: ui_ing_red_bean_detail.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#ui_ing_red_bean_detail

## spr_ing_small_pearl_base · 小珍珠

- category: ingredient
- first_phase: P1
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 1024x1024 layered
- export_spec: 128x128;256x256;512x512 PNG
- runtime_du: visible diameter 64
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 黑糖棕单珠，单个白高光；主色参考#5A3428；左上45度柔光；主体中心(512,512)，基准主体半径460.8px，外廓与碰撞偏差≤8%；无大外投影；层分base/texture/highlight/optional_face。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: spr_ing_small_pearl_base.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 3
- library_index: assets/library/index.html#spr_ing_small_pearl_base

## ui_ing_small_pearl_thumb · 小珍珠缩略图

- category: ingredient_thumbnail
- first_phase: P1
- required: required
- production_method: derived
- source_asset_id: spr_ing_small_pearl_base
- source_spec: reuse spr_ing_small_pearl_base
- export_spec: 96x96 PNG
- runtime_du: 48x48
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 从母版缩小后人工检查，必要时简化细纹；不改变材质和轮廓。
- color_space: sRGB
- status: planned
- license_status: inherits_source_or_code
- filename: ui_ing_small_pearl_thumb.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#ui_ing_small_pearl_thumb

## ui_ing_small_pearl_locked · 小珍珠图鉴未发现剪影

- category: collection
- first_phase: P4-B
- required: required
- production_method: derived
- source_asset_id: spr_ing_small_pearl_base
- source_spec: reuse spr_ing_small_pearl_base
- export_spec: 192x192 PNG
- runtime_du: 96x96
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 原图alpha生成统一中性轮廓；问号为动态文字，不新增真实小料等级。
- color_space: sRGB
- status: deferred
- license_status: inherits_source_or_code
- filename: ui_ing_small_pearl_locked.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#ui_ing_small_pearl_locked

## ui_ing_small_pearl_detail · 小珍珠图鉴详情图

- category: collection
- first_phase: P4-B
- required: required
- production_method: derived
- source_asset_id: spr_ing_small_pearl_base
- source_spec: reuse spr_ing_small_pearl_base
- export_spec: 512x512 PNG
- runtime_du: 256x256
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 直接使用母版导出，不重复绘制；详情名称/等级由程序排版。
- color_space: sRGB
- status: deferred
- license_status: inherits_source_or_code
- filename: ui_ing_small_pearl_detail.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#ui_ing_small_pearl_detail

## spr_ing_coconut_base · 椰果

- category: ingredient
- first_phase: P1
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 1024x1024 layered
- export_spec: 128x128;256x256;512x512 PNG
- runtime_du: visible diameter 84
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 乳白圆角团，内部椰果方形纹，外廓近圆；主色参考#EFE7CE；左上45度柔光；主体中心(512,512)，基准主体半径460.8px，外廓与碰撞偏差≤8%；无大外投影；层分base/texture/highlight/optional_face。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: spr_ing_coconut_base.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 3
- library_index: assets/library/index.html#spr_ing_coconut_base

## ui_ing_coconut_thumb · 椰果缩略图

- category: ingredient_thumbnail
- first_phase: P1
- required: required
- production_method: derived
- source_asset_id: spr_ing_coconut_base
- source_spec: reuse spr_ing_coconut_base
- export_spec: 96x96 PNG
- runtime_du: 48x48
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 从母版缩小后人工检查，必要时简化细纹；不改变材质和轮廓。
- color_space: sRGB
- status: planned
- license_status: inherits_source_or_code
- filename: ui_ing_coconut_thumb.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#ui_ing_coconut_thumb

## ui_ing_coconut_locked · 椰果图鉴未发现剪影

- category: collection
- first_phase: P4-B
- required: required
- production_method: derived
- source_asset_id: spr_ing_coconut_base
- source_spec: reuse spr_ing_coconut_base
- export_spec: 192x192 PNG
- runtime_du: 96x96
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 原图alpha生成统一中性轮廓；问号为动态文字，不新增真实小料等级。
- color_space: sRGB
- status: deferred
- license_status: inherits_source_or_code
- filename: ui_ing_coconut_locked.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#ui_ing_coconut_locked

## ui_ing_coconut_detail · 椰果图鉴详情图

- category: collection
- first_phase: P4-B
- required: required
- production_method: derived
- source_asset_id: spr_ing_coconut_base
- source_spec: reuse spr_ing_coconut_base
- export_spec: 512x512 PNG
- runtime_du: 256x256
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 直接使用母版导出，不重复绘制；详情名称/等级由程序排版。
- color_space: sRGB
- status: deferred
- license_status: inherits_source_or_code
- filename: ui_ing_coconut_detail.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#ui_ing_coconut_detail

## spr_ing_large_pearl_base · 大珍珠

- category: ingredient
- first_phase: P1
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 1024x1024 layered
- export_spec: 128x128;256x256;512x512 PNG
- runtime_du: visible diameter 110
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 深棕大珍珠，双层高光，与小珍珠分别绘制；主色参考#37251F；左上45度柔光；主体中心(512,512)，基准主体半径460.8px，外廓与碰撞偏差≤8%；无大外投影；层分base/texture/highlight/optional_face。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: spr_ing_large_pearl_base.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 3
- library_index: assets/library/index.html#spr_ing_large_pearl_base

## ui_ing_large_pearl_thumb · 大珍珠缩略图

- category: ingredient_thumbnail
- first_phase: P1
- required: required
- production_method: derived
- source_asset_id: spr_ing_large_pearl_base
- source_spec: reuse spr_ing_large_pearl_base
- export_spec: 96x96 PNG
- runtime_du: 48x48
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 从母版缩小后人工检查，必要时简化细纹；不改变材质和轮廓。
- color_space: sRGB
- status: planned
- license_status: inherits_source_or_code
- filename: ui_ing_large_pearl_thumb.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#ui_ing_large_pearl_thumb

## ui_ing_large_pearl_locked · 大珍珠图鉴未发现剪影

- category: collection
- first_phase: P4-B
- required: required
- production_method: derived
- source_asset_id: spr_ing_large_pearl_base
- source_spec: reuse spr_ing_large_pearl_base
- export_spec: 192x192 PNG
- runtime_du: 96x96
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 原图alpha生成统一中性轮廓；问号为动态文字，不新增真实小料等级。
- color_space: sRGB
- status: deferred
- license_status: inherits_source_or_code
- filename: ui_ing_large_pearl_locked.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#ui_ing_large_pearl_locked

## ui_ing_large_pearl_detail · 大珍珠图鉴详情图

- category: collection
- first_phase: P4-B
- required: required
- production_method: derived
- source_asset_id: spr_ing_large_pearl_base
- source_spec: reuse spr_ing_large_pearl_base
- export_spec: 512x512 PNG
- runtime_du: 256x256
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 直接使用母版导出，不重复绘制；详情名称/等级由程序排版。
- color_space: sRGB
- status: deferred
- license_status: inherits_source_or_code
- filename: ui_ing_large_pearl_detail.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#ui_ing_large_pearl_detail

## spr_ing_grass_jelly_base · 仙草冻

- category: ingredient
- first_phase: P1
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 1024x1024 layered
- export_spec: 128x128;256x256;512x512 PNG
- runtime_du: visible diameter 140
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 近黑绿仙草胶冻，透亮边缘和弯月亮面；主色参考#354438；左上45度柔光；主体中心(512,512)，基准主体半径460.8px，外廓与碰撞偏差≤8%；无大外投影；层分base/texture/highlight/optional_face。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: spr_ing_grass_jelly_base.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 3
- library_index: assets/library/index.html#spr_ing_grass_jelly_base

## ui_ing_grass_jelly_thumb · 仙草冻缩略图

- category: ingredient_thumbnail
- first_phase: P1
- required: required
- production_method: derived
- source_asset_id: spr_ing_grass_jelly_base
- source_spec: reuse spr_ing_grass_jelly_base
- export_spec: 96x96 PNG
- runtime_du: 48x48
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 从母版缩小后人工检查，必要时简化细纹；不改变材质和轮廓。
- color_space: sRGB
- status: planned
- license_status: inherits_source_or_code
- filename: ui_ing_grass_jelly_thumb.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#ui_ing_grass_jelly_thumb

## ui_ing_grass_jelly_locked · 仙草冻图鉴未发现剪影

- category: collection
- first_phase: P4-B
- required: required
- production_method: derived
- source_asset_id: spr_ing_grass_jelly_base
- source_spec: reuse spr_ing_grass_jelly_base
- export_spec: 192x192 PNG
- runtime_du: 96x96
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 原图alpha生成统一中性轮廓；问号为动态文字，不新增真实小料等级。
- color_space: sRGB
- status: deferred
- license_status: inherits_source_or_code
- filename: ui_ing_grass_jelly_locked.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#ui_ing_grass_jelly_locked

## ui_ing_grass_jelly_detail · 仙草冻图鉴详情图

- category: collection
- first_phase: P4-B
- required: required
- production_method: derived
- source_asset_id: spr_ing_grass_jelly_base
- source_spec: reuse spr_ing_grass_jelly_base
- export_spec: 512x512 PNG
- runtime_du: 256x256
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 直接使用母版导出，不重复绘制；详情名称/等级由程序排版。
- color_space: sRGB
- status: deferred
- license_status: inherits_source_or_code
- filename: ui_ing_grass_jelly_detail.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#ui_ing_grass_jelly_detail

## spr_ing_pudding_base · 布丁

- category: ingredient
- first_phase: P1
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 1024x1024 layered
- export_spec: 128x128;256x256;512x512 PNG
- runtime_du: visible diameter 178
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 淡黄布丁，焦糖顶部，宽圆无细脚；主色参考#EAC36E；左上45度柔光；主体中心(512,512)，基准主体半径460.8px，外廓与碰撞偏差≤8%；无大外投影；层分base/texture/highlight/optional_face。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: spr_ing_pudding_base.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 3
- library_index: assets/library/index.html#spr_ing_pudding_base

## ui_ing_pudding_thumb · 布丁缩略图

- category: ingredient_thumbnail
- first_phase: P1
- required: required
- production_method: derived
- source_asset_id: spr_ing_pudding_base
- source_spec: reuse spr_ing_pudding_base
- export_spec: 96x96 PNG
- runtime_du: 48x48
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 从母版缩小后人工检查，必要时简化细纹；不改变材质和轮廓。
- color_space: sRGB
- status: planned
- license_status: inherits_source_or_code
- filename: ui_ing_pudding_thumb.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#ui_ing_pudding_thumb

## ui_ing_pudding_locked · 布丁图鉴未发现剪影

- category: collection
- first_phase: P4-B
- required: required
- production_method: derived
- source_asset_id: spr_ing_pudding_base
- source_spec: reuse spr_ing_pudding_base
- export_spec: 192x192 PNG
- runtime_du: 96x96
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 原图alpha生成统一中性轮廓；问号为动态文字，不新增真实小料等级。
- color_space: sRGB
- status: deferred
- license_status: inherits_source_or_code
- filename: ui_ing_pudding_locked.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#ui_ing_pudding_locked

## ui_ing_pudding_detail · 布丁图鉴详情图

- category: collection
- first_phase: P4-B
- required: required
- production_method: derived
- source_asset_id: spr_ing_pudding_base
- source_spec: reuse spr_ing_pudding_base
- export_spec: 512x512 PNG
- runtime_du: 256x256
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 直接使用母版导出，不重复绘制；详情名称/等级由程序排版。
- color_space: sRGB
- status: deferred
- license_status: inherits_source_or_code
- filename: ui_ing_pudding_detail.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#ui_ing_pudding_detail

## spr_ing_taro_base · 芋泥球

- category: ingredient
- first_phase: P1
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 1024x1024 layered
- export_spec: 128x128;256x256;512x512 PNG
- runtime_du: visible diameter 224
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 淡紫绵密芋泥球，旋纹哑光；主色参考#AA87BE；左上45度柔光；主体中心(512,512)，基准主体半径460.8px，外廓与碰撞偏差≤8%；无大外投影；层分base/texture/highlight/optional_face。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: spr_ing_taro_base.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 3
- library_index: assets/library/index.html#spr_ing_taro_base

## ui_ing_taro_thumb · 芋泥球缩略图

- category: ingredient_thumbnail
- first_phase: P1
- required: required
- production_method: derived
- source_asset_id: spr_ing_taro_base
- source_spec: reuse spr_ing_taro_base
- export_spec: 96x96 PNG
- runtime_du: 48x48
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 从母版缩小后人工检查，必要时简化细纹；不改变材质和轮廓。
- color_space: sRGB
- status: planned
- license_status: inherits_source_or_code
- filename: ui_ing_taro_thumb.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#ui_ing_taro_thumb

## ui_ing_taro_locked · 芋泥球图鉴未发现剪影

- category: collection
- first_phase: P4-B
- required: required
- production_method: derived
- source_asset_id: spr_ing_taro_base
- source_spec: reuse spr_ing_taro_base
- export_spec: 192x192 PNG
- runtime_du: 96x96
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 原图alpha生成统一中性轮廓；问号为动态文字，不新增真实小料等级。
- color_space: sRGB
- status: deferred
- license_status: inherits_source_or_code
- filename: ui_ing_taro_locked.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#ui_ing_taro_locked

## ui_ing_taro_detail · 芋泥球图鉴详情图

- category: collection
- first_phase: P4-B
- required: required
- production_method: derived
- source_asset_id: spr_ing_taro_base
- source_spec: reuse spr_ing_taro_base
- export_spec: 512x512 PNG
- runtime_du: 256x256
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 直接使用母版导出，不重复绘制；详情名称/等级由程序排版。
- color_space: sRGB
- status: deferred
- license_status: inherits_source_or_code
- filename: ui_ing_taro_detail.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#ui_ing_taro_detail

## spr_ing_mochi_base · 麻薯团

- category: ingredient
- first_phase: P1
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 1024x1024 layered
- export_spec: 128x128;256x256;512x512 PNG
- runtime_du: visible diameter 280
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 奶白软麻薯，粉感与居中压痕，最高级独特；主色参考#F3E8DA；左上45度柔光；主体中心(512,512)，基准主体半径460.8px，外廓与碰撞偏差≤8%；无大外投影；层分base/texture/highlight/optional_face。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: spr_ing_mochi_base.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 3
- library_index: assets/library/index.html#spr_ing_mochi_base

## ui_ing_mochi_thumb · 麻薯团缩略图

- category: ingredient_thumbnail
- first_phase: P1
- required: required
- production_method: derived
- source_asset_id: spr_ing_mochi_base
- source_spec: reuse spr_ing_mochi_base
- export_spec: 96x96 PNG
- runtime_du: 48x48
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 从母版缩小后人工检查，必要时简化细纹；不改变材质和轮廓。
- color_space: sRGB
- status: planned
- license_status: inherits_source_or_code
- filename: ui_ing_mochi_thumb.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#ui_ing_mochi_thumb

## ui_ing_mochi_locked · 麻薯团图鉴未发现剪影

- category: collection
- first_phase: P4-B
- required: required
- production_method: derived
- source_asset_id: spr_ing_mochi_base
- source_spec: reuse spr_ing_mochi_base
- export_spec: 192x192 PNG
- runtime_du: 96x96
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 原图alpha生成统一中性轮廓；问号为动态文字，不新增真实小料等级。
- color_space: sRGB
- status: deferred
- license_status: inherits_source_or_code
- filename: ui_ing_mochi_locked.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#ui_ing_mochi_locked

## ui_ing_mochi_detail · 麻薯团图鉴详情图

- category: collection
- first_phase: P4-B
- required: required
- production_method: derived
- source_asset_id: spr_ing_mochi_base
- source_spec: reuse spr_ing_mochi_base
- export_spec: 512x512 PNG
- runtime_du: 256x256
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 直接使用母版导出，不重复绘制；详情名称/等级由程序排版。
- color_space: sRGB
- status: deferred
- license_status: inherits_source_or_code
- filename: ui_ing_mochi_detail.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#ui_ing_mochi_detail

## spr_face_neutral · 通用中性眼嘴

- category: optional_face
- first_phase: P1
- required: optional
- production_method: new_draw
- source_asset_id: 
- source_spec: 256x128 SVG/layered
- export_spec: 256x128 PNG
- runtime_du: relative to ingredient
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 独立眼嘴覆盖层，单色深棕，透明背景；锚点相同，不遮配料主要纹理；静态三表情切换即可，无需逐帧。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: spr_face_neutral.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#spr_face_neutral

## spr_face_happy · 通用短时微笑

- category: optional_face
- first_phase: P1
- required: optional
- production_method: new_draw
- source_asset_id: 
- source_spec: 256x128 SVG/layered
- export_spec: 256x128 PNG
- runtime_du: relative to ingredient
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 独立眼嘴覆盖层，单色深棕，透明背景；锚点相同，不遮配料主要纹理；静态三表情切换即可，无需逐帧。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: spr_face_happy.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#spr_face_happy

## spr_face_surprised · 通用危险时惊讶

- category: optional_face
- first_phase: P1
- required: optional
- production_method: new_draw
- source_asset_id: 
- source_spec: 256x128 SVG/layered
- export_spec: 256x128 PNG
- runtime_du: relative to ingredient
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 独立眼嘴覆盖层，单色深棕，透明背景；锚点相同，不遮配料主要纹理；静态三表情切换即可，无需逐帧。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: spr_face_surprised.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#spr_face_surprised

## spr_cup_classic_back · 经典奶茶杯后壁

- category: cup_layer
- first_phase: P1
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 1500x2000 layered; registered world origin (0,200)
- export_spec: 750x1000 PNG
- runtime_du: 750x1000
- alpha: yes
- pivot: 0,0
- nine_slice: none
- states: single
- visual_requirements: 半透明后缘，保留杯内内容可读。 主调#D8B58A；画布对应世界x0..750/y200..1200；杯内缘使用该款CupGeometry导出导线，顶y1060/底y260；所有层同画布禁止各自裁切或缩放。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: spr_cup_classic_back.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#spr_cup_classic_back

## spr_cup_classic_tea · 经典奶茶杯内奶茶底色

- category: cup_layer
- first_phase: P1
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 1500x2000 layered; registered world origin (0,200)
- export_spec: 750x1000 PNG
- runtime_du: 750x1000
- alpha: yes
- pivot: 0,0
- nine_slice: none
- states: single
- visual_requirements: 静态装饰底色，不画会误导物理的流动漩涡，不遮盖配料。 主调#D8B58A；画布对应世界x0..750/y200..1200；杯内缘使用该款CupGeometry导出导线，顶y1060/底y260；所有层同画布禁止各自裁切或缩放。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: spr_cup_classic_tea.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#spr_cup_classic_tea

## spr_cup_classic_front · 经典奶茶杯前壁高光

- category: cup_layer
- first_phase: P1
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 1500x2000 layered; registered world origin (0,200)
- export_spec: 750x1000 PNG
- runtime_du: 750x1000
- alpha: yes
- pivot: 0,0
- nine_slice: none
- states: single
- visual_requirements: 前景alpha高光占杯面积约≤10%，禁止整杯深色透明遮罩。 主调#D8B58A；画布对应世界x0..750/y200..1200；杯内缘使用该款CupGeometry导出导线，顶y1060/底y260；所有层同画布禁止各自裁切或缩放。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: spr_cup_classic_front.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#spr_cup_classic_front

## spr_cup_classic_rim_back · 经典奶茶杯口后缘

- category: cup_layer
- first_phase: P1
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 1500x2000 layered; registered world origin (0,200)
- export_spec: 750x1000 PNG
- runtime_du: 750x1000
- alpha: yes
- pivot: 0,0
- nine_slice: none
- states: single
- visual_requirements: 轻椭圆后半缘，仅表现厚度，不能暗示顶部有盖。 主调#D8B58A；画布对应世界x0..750/y200..1200；杯内缘使用该款CupGeometry导出导线，顶y1060/底y260；所有层同画布禁止各自裁切或缩放。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: spr_cup_classic_rim_back.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#spr_cup_classic_rim_back

## spr_cup_classic_rim_front · 经典奶茶杯口前缘

- category: cup_layer
- first_phase: P1
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 1500x2000 layered; registered world origin (0,200)
- export_spec: 750x1000 PNG
- runtime_du: 750x1000
- alpha: yes
- pivot: 0,0
- nine_slice: none
- states: single
- visual_requirements: 前半缘薄高光，不遮危险线/落点。 主调#D8B58A；画布对应世界x0..750/y200..1200；杯内缘使用该款CupGeometry导出导线，顶y1060/底y260；所有层同画布禁止各自裁切或缩放。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: spr_cup_classic_rim_front.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#spr_cup_classic_rim_front

## spr_cup_classic_base · 经典奶茶杯底装饰

- category: cup_layer
- first_phase: P1
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 1500x2000 layered; registered world origin (0,200)
- export_spec: 750x1000 PNG
- runtime_du: 750x1000
- alpha: yes
- pivot: 0,0
- nine_slice: none
- states: single
- visual_requirements: 视觉贴合y260物理杯底，无可支撑的假凸台。 主调#D8B58A；画布对应世界x0..750/y200..1200；杯内缘使用该款CupGeometry导出导线，顶y1060/底y260；所有层同画布禁止各自裁切或缩放。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: spr_cup_classic_base.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#spr_cup_classic_base

## spr_cup_classic_label · 经典奶茶杯身无文字印花

- category: cup_layer
- first_phase: P1
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 1500x2000 layered; registered world origin (0,200)
- export_spec: 750x1000 PNG
- runtime_du: 750x1000
- alpha: yes
- pivot: 0,0
- nine_slice: none
- states: single
- visual_requirements: 原创抽象图形，动态款名另排文字，不用真实奶茶品牌。 主调#D8B58A；画布对应世界x0..750/y200..1200；杯内缘使用该款CupGeometry导出导线，顶y1060/底y260；所有层同画布禁止各自裁切或缩放。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: spr_cup_classic_label.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#spr_cup_classic_label

## ui_stage_classic_card · 经典奶茶菜单封面

- category: stage_select
- first_phase: P3-A
- required: required
- production_method: derived
- source_asset_id: spr_cup_classic_back
- source_spec: reuse cup layers
- export_spec: 480x600 PNG
- runtime_du: 240x300
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 从该款杯图层合成，留30%区域给动态款名/纪录/解锁信息；不烘分数或锁。
- color_space: sRGB
- status: deferred
- license_status: inherits_source_or_code
- filename: ui_stage_classic_card.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#ui_stage_classic_card

## spr_cup_coconut_green_back · 椰香绿茶杯后壁

- category: cup_layer
- first_phase: P3-A
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 1500x2000 layered; registered world origin (0,200)
- export_spec: 750x1000 PNG
- runtime_du: 750x1000
- alpha: yes
- pivot: 0,0
- nine_slice: none
- states: single
- visual_requirements: 半透明后缘，保留杯内内容可读。 主调#BED2B3；画布对应世界x0..750/y200..1200；杯内缘使用该款CupGeometry导出导线，顶y1060/底y260；所有层同画布禁止各自裁切或缩放。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: spr_cup_coconut_green_back.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#spr_cup_coconut_green_back

## spr_cup_coconut_green_tea · 椰香绿茶杯内奶茶底色

- category: cup_layer
- first_phase: P3-A
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 1500x2000 layered; registered world origin (0,200)
- export_spec: 750x1000 PNG
- runtime_du: 750x1000
- alpha: yes
- pivot: 0,0
- nine_slice: none
- states: single
- visual_requirements: 静态装饰底色，不画会误导物理的流动漩涡，不遮盖配料。 主调#BED2B3；画布对应世界x0..750/y200..1200；杯内缘使用该款CupGeometry导出导线，顶y1060/底y260；所有层同画布禁止各自裁切或缩放。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: spr_cup_coconut_green_tea.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#spr_cup_coconut_green_tea

## spr_cup_coconut_green_front · 椰香绿茶杯前壁高光

- category: cup_layer
- first_phase: P3-A
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 1500x2000 layered; registered world origin (0,200)
- export_spec: 750x1000 PNG
- runtime_du: 750x1000
- alpha: yes
- pivot: 0,0
- nine_slice: none
- states: single
- visual_requirements: 前景alpha高光占杯面积约≤10%，禁止整杯深色透明遮罩。 主调#BED2B3；画布对应世界x0..750/y200..1200；杯内缘使用该款CupGeometry导出导线，顶y1060/底y260；所有层同画布禁止各自裁切或缩放。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: spr_cup_coconut_green_front.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#spr_cup_coconut_green_front

## spr_cup_coconut_green_rim_back · 椰香绿茶杯口后缘

- category: cup_layer
- first_phase: P3-A
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 1500x2000 layered; registered world origin (0,200)
- export_spec: 750x1000 PNG
- runtime_du: 750x1000
- alpha: yes
- pivot: 0,0
- nine_slice: none
- states: single
- visual_requirements: 轻椭圆后半缘，仅表现厚度，不能暗示顶部有盖。 主调#BED2B3；画布对应世界x0..750/y200..1200；杯内缘使用该款CupGeometry导出导线，顶y1060/底y260；所有层同画布禁止各自裁切或缩放。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: spr_cup_coconut_green_rim_back.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#spr_cup_coconut_green_rim_back

## spr_cup_coconut_green_rim_front · 椰香绿茶杯口前缘

- category: cup_layer
- first_phase: P3-A
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 1500x2000 layered; registered world origin (0,200)
- export_spec: 750x1000 PNG
- runtime_du: 750x1000
- alpha: yes
- pivot: 0,0
- nine_slice: none
- states: single
- visual_requirements: 前半缘薄高光，不遮危险线/落点。 主调#BED2B3；画布对应世界x0..750/y200..1200；杯内缘使用该款CupGeometry导出导线，顶y1060/底y260；所有层同画布禁止各自裁切或缩放。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: spr_cup_coconut_green_rim_front.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#spr_cup_coconut_green_rim_front

## spr_cup_coconut_green_base · 椰香绿茶杯底装饰

- category: cup_layer
- first_phase: P3-A
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 1500x2000 layered; registered world origin (0,200)
- export_spec: 750x1000 PNG
- runtime_du: 750x1000
- alpha: yes
- pivot: 0,0
- nine_slice: none
- states: single
- visual_requirements: 视觉贴合y260物理杯底，无可支撑的假凸台。 主调#BED2B3；画布对应世界x0..750/y200..1200；杯内缘使用该款CupGeometry导出导线，顶y1060/底y260；所有层同画布禁止各自裁切或缩放。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: spr_cup_coconut_green_base.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#spr_cup_coconut_green_base

## spr_cup_coconut_green_label · 椰香绿茶杯身无文字印花

- category: cup_layer
- first_phase: P3-A
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 1500x2000 layered; registered world origin (0,200)
- export_spec: 750x1000 PNG
- runtime_du: 750x1000
- alpha: yes
- pivot: 0,0
- nine_slice: none
- states: single
- visual_requirements: 原创抽象图形，动态款名另排文字，不用真实奶茶品牌。 主调#BED2B3；画布对应世界x0..750/y200..1200；杯内缘使用该款CupGeometry导出导线，顶y1060/底y260；所有层同画布禁止各自裁切或缩放。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: spr_cup_coconut_green_label.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#spr_cup_coconut_green_label

## ui_stage_coconut_green_card · 椰香绿茶菜单封面

- category: stage_select
- first_phase: P3-A
- required: required
- production_method: derived
- source_asset_id: spr_cup_coconut_green_back
- source_spec: reuse cup layers
- export_spec: 480x600 PNG
- runtime_du: 240x300
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 从该款杯图层合成，留30%区域给动态款名/纪录/解锁信息；不烘分数或锁。
- color_space: sRGB
- status: deferred
- license_status: inherits_source_or_code
- filename: ui_stage_coconut_green_card.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#ui_stage_coconut_green_card

## spr_cup_taro_boba_back · 芋泥波波杯后壁

- category: cup_layer
- first_phase: P3-A
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 1500x2000 layered; registered world origin (0,200)
- export_spec: 750x1000 PNG
- runtime_du: 750x1000
- alpha: yes
- pivot: 0,0
- nine_slice: none
- states: single
- visual_requirements: 半透明后缘，保留杯内内容可读。 主调#B99ACA；画布对应世界x0..750/y200..1200；杯内缘使用该款CupGeometry导出导线，顶y1060/底y260；所有层同画布禁止各自裁切或缩放。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: spr_cup_taro_boba_back.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#spr_cup_taro_boba_back

## spr_cup_taro_boba_tea · 芋泥波波杯内奶茶底色

- category: cup_layer
- first_phase: P3-A
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 1500x2000 layered; registered world origin (0,200)
- export_spec: 750x1000 PNG
- runtime_du: 750x1000
- alpha: yes
- pivot: 0,0
- nine_slice: none
- states: single
- visual_requirements: 静态装饰底色，不画会误导物理的流动漩涡，不遮盖配料。 主调#B99ACA；画布对应世界x0..750/y200..1200；杯内缘使用该款CupGeometry导出导线，顶y1060/底y260；所有层同画布禁止各自裁切或缩放。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: spr_cup_taro_boba_tea.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#spr_cup_taro_boba_tea

## spr_cup_taro_boba_front · 芋泥波波杯前壁高光

- category: cup_layer
- first_phase: P3-A
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 1500x2000 layered; registered world origin (0,200)
- export_spec: 750x1000 PNG
- runtime_du: 750x1000
- alpha: yes
- pivot: 0,0
- nine_slice: none
- states: single
- visual_requirements: 前景alpha高光占杯面积约≤10%，禁止整杯深色透明遮罩。 主调#B99ACA；画布对应世界x0..750/y200..1200；杯内缘使用该款CupGeometry导出导线，顶y1060/底y260；所有层同画布禁止各自裁切或缩放。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: spr_cup_taro_boba_front.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#spr_cup_taro_boba_front

## spr_cup_taro_boba_rim_back · 芋泥波波杯口后缘

- category: cup_layer
- first_phase: P3-A
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 1500x2000 layered; registered world origin (0,200)
- export_spec: 750x1000 PNG
- runtime_du: 750x1000
- alpha: yes
- pivot: 0,0
- nine_slice: none
- states: single
- visual_requirements: 轻椭圆后半缘，仅表现厚度，不能暗示顶部有盖。 主调#B99ACA；画布对应世界x0..750/y200..1200；杯内缘使用该款CupGeometry导出导线，顶y1060/底y260；所有层同画布禁止各自裁切或缩放。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: spr_cup_taro_boba_rim_back.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#spr_cup_taro_boba_rim_back

## spr_cup_taro_boba_rim_front · 芋泥波波杯口前缘

- category: cup_layer
- first_phase: P3-A
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 1500x2000 layered; registered world origin (0,200)
- export_spec: 750x1000 PNG
- runtime_du: 750x1000
- alpha: yes
- pivot: 0,0
- nine_slice: none
- states: single
- visual_requirements: 前半缘薄高光，不遮危险线/落点。 主调#B99ACA；画布对应世界x0..750/y200..1200；杯内缘使用该款CupGeometry导出导线，顶y1060/底y260；所有层同画布禁止各自裁切或缩放。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: spr_cup_taro_boba_rim_front.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#spr_cup_taro_boba_rim_front

## spr_cup_taro_boba_base · 芋泥波波杯底装饰

- category: cup_layer
- first_phase: P3-A
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 1500x2000 layered; registered world origin (0,200)
- export_spec: 750x1000 PNG
- runtime_du: 750x1000
- alpha: yes
- pivot: 0,0
- nine_slice: none
- states: single
- visual_requirements: 视觉贴合y260物理杯底，无可支撑的假凸台。 主调#B99ACA；画布对应世界x0..750/y200..1200；杯内缘使用该款CupGeometry导出导线，顶y1060/底y260；所有层同画布禁止各自裁切或缩放。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: spr_cup_taro_boba_base.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#spr_cup_taro_boba_base

## spr_cup_taro_boba_label · 芋泥波波杯身无文字印花

- category: cup_layer
- first_phase: P3-A
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 1500x2000 layered; registered world origin (0,200)
- export_spec: 750x1000 PNG
- runtime_du: 750x1000
- alpha: yes
- pivot: 0,0
- nine_slice: none
- states: single
- visual_requirements: 原创抽象图形，动态款名另排文字，不用真实奶茶品牌。 主调#B99ACA；画布对应世界x0..750/y200..1200；杯内缘使用该款CupGeometry导出导线，顶y1060/底y260；所有层同画布禁止各自裁切或缩放。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: spr_cup_taro_boba_label.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#spr_cup_taro_boba_label

## ui_stage_taro_boba_card · 芋泥波波菜单封面

- category: stage_select
- first_phase: P3-A
- required: required
- production_method: derived
- source_asset_id: spr_cup_taro_boba_back
- source_spec: reuse cup layers
- export_spec: 480x600 PNG
- runtime_du: 240x300
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 从该款杯图层合成，留30%区域给动态款名/纪录/解锁信息；不烘分数或锁。
- color_space: sRGB
- status: deferred
- license_status: inherits_source_or_code
- filename: ui_stage_taro_boba_card.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#ui_stage_taro_boba_card

## spr_cup_brown_sugar_back · 黑糖厚乳杯后壁

- category: cup_layer
- first_phase: P3-A
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 1500x2000 layered; registered world origin (0,200)
- export_spec: 750x1000 PNG
- runtime_du: 750x1000
- alpha: yes
- pivot: 0,0
- nine_slice: none
- states: single
- visual_requirements: 半透明后缘，保留杯内内容可读。 主调#B3835D；画布对应世界x0..750/y200..1200；杯内缘使用该款CupGeometry导出导线，顶y1060/底y260；所有层同画布禁止各自裁切或缩放。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: spr_cup_brown_sugar_back.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#spr_cup_brown_sugar_back

## spr_cup_brown_sugar_tea · 黑糖厚乳杯内奶茶底色

- category: cup_layer
- first_phase: P3-A
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 1500x2000 layered; registered world origin (0,200)
- export_spec: 750x1000 PNG
- runtime_du: 750x1000
- alpha: yes
- pivot: 0,0
- nine_slice: none
- states: single
- visual_requirements: 静态装饰底色，不画会误导物理的流动漩涡，不遮盖配料。 主调#B3835D；画布对应世界x0..750/y200..1200；杯内缘使用该款CupGeometry导出导线，顶y1060/底y260；所有层同画布禁止各自裁切或缩放。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: spr_cup_brown_sugar_tea.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#spr_cup_brown_sugar_tea

## spr_cup_brown_sugar_front · 黑糖厚乳杯前壁高光

- category: cup_layer
- first_phase: P3-A
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 1500x2000 layered; registered world origin (0,200)
- export_spec: 750x1000 PNG
- runtime_du: 750x1000
- alpha: yes
- pivot: 0,0
- nine_slice: none
- states: single
- visual_requirements: 前景alpha高光占杯面积约≤10%，禁止整杯深色透明遮罩。 主调#B3835D；画布对应世界x0..750/y200..1200；杯内缘使用该款CupGeometry导出导线，顶y1060/底y260；所有层同画布禁止各自裁切或缩放。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: spr_cup_brown_sugar_front.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#spr_cup_brown_sugar_front

## spr_cup_brown_sugar_rim_back · 黑糖厚乳杯口后缘

- category: cup_layer
- first_phase: P3-A
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 1500x2000 layered; registered world origin (0,200)
- export_spec: 750x1000 PNG
- runtime_du: 750x1000
- alpha: yes
- pivot: 0,0
- nine_slice: none
- states: single
- visual_requirements: 轻椭圆后半缘，仅表现厚度，不能暗示顶部有盖。 主调#B3835D；画布对应世界x0..750/y200..1200；杯内缘使用该款CupGeometry导出导线，顶y1060/底y260；所有层同画布禁止各自裁切或缩放。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: spr_cup_brown_sugar_rim_back.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#spr_cup_brown_sugar_rim_back

## spr_cup_brown_sugar_rim_front · 黑糖厚乳杯口前缘

- category: cup_layer
- first_phase: P3-A
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 1500x2000 layered; registered world origin (0,200)
- export_spec: 750x1000 PNG
- runtime_du: 750x1000
- alpha: yes
- pivot: 0,0
- nine_slice: none
- states: single
- visual_requirements: 前半缘薄高光，不遮危险线/落点。 主调#B3835D；画布对应世界x0..750/y200..1200；杯内缘使用该款CupGeometry导出导线，顶y1060/底y260；所有层同画布禁止各自裁切或缩放。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: spr_cup_brown_sugar_rim_front.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#spr_cup_brown_sugar_rim_front

## spr_cup_brown_sugar_base · 黑糖厚乳杯底装饰

- category: cup_layer
- first_phase: P3-A
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 1500x2000 layered; registered world origin (0,200)
- export_spec: 750x1000 PNG
- runtime_du: 750x1000
- alpha: yes
- pivot: 0,0
- nine_slice: none
- states: single
- visual_requirements: 视觉贴合y260物理杯底，无可支撑的假凸台。 主调#B3835D；画布对应世界x0..750/y200..1200；杯内缘使用该款CupGeometry导出导线，顶y1060/底y260；所有层同画布禁止各自裁切或缩放。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: spr_cup_brown_sugar_base.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#spr_cup_brown_sugar_base

## spr_cup_brown_sugar_label · 黑糖厚乳杯身无文字印花

- category: cup_layer
- first_phase: P3-A
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 1500x2000 layered; registered world origin (0,200)
- export_spec: 750x1000 PNG
- runtime_du: 750x1000
- alpha: yes
- pivot: 0,0
- nine_slice: none
- states: single
- visual_requirements: 原创抽象图形，动态款名另排文字，不用真实奶茶品牌。 主调#B3835D；画布对应世界x0..750/y200..1200；杯内缘使用该款CupGeometry导出导线，顶y1060/底y260；所有层同画布禁止各自裁切或缩放。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: spr_cup_brown_sugar_label.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#spr_cup_brown_sugar_label

## ui_stage_brown_sugar_card · 黑糖厚乳菜单封面

- category: stage_select
- first_phase: P3-A
- required: required
- production_method: derived
- source_asset_id: spr_cup_brown_sugar_back
- source_spec: reuse cup layers
- export_spec: 480x600 PNG
- runtime_du: 240x300
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 从该款杯图层合成，留30%区域给动态款名/纪录/解锁信息；不烘分数或锁。
- color_space: sRGB
- status: deferred
- license_status: inherits_source_or_code
- filename: ui_stage_brown_sugar_card.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#ui_stage_brown_sugar_card

## spr_cup_mochi_special_back · 麻薯特调杯后壁

- category: cup_layer
- first_phase: P3-A
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 1500x2000 layered; registered world origin (0,200)
- export_spec: 750x1000 PNG
- runtime_du: 750x1000
- alpha: yes
- pivot: 0,0
- nine_slice: none
- states: single
- visual_requirements: 半透明后缘，保留杯内内容可读。 主调#E6D1C8；画布对应世界x0..750/y200..1200；杯内缘使用该款CupGeometry导出导线，顶y1060/底y260；所有层同画布禁止各自裁切或缩放。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: spr_cup_mochi_special_back.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#spr_cup_mochi_special_back

## spr_cup_mochi_special_tea · 麻薯特调杯内奶茶底色

- category: cup_layer
- first_phase: P3-A
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 1500x2000 layered; registered world origin (0,200)
- export_spec: 750x1000 PNG
- runtime_du: 750x1000
- alpha: yes
- pivot: 0,0
- nine_slice: none
- states: single
- visual_requirements: 静态装饰底色，不画会误导物理的流动漩涡，不遮盖配料。 主调#E6D1C8；画布对应世界x0..750/y200..1200；杯内缘使用该款CupGeometry导出导线，顶y1060/底y260；所有层同画布禁止各自裁切或缩放。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: spr_cup_mochi_special_tea.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#spr_cup_mochi_special_tea

## spr_cup_mochi_special_front · 麻薯特调杯前壁高光

- category: cup_layer
- first_phase: P3-A
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 1500x2000 layered; registered world origin (0,200)
- export_spec: 750x1000 PNG
- runtime_du: 750x1000
- alpha: yes
- pivot: 0,0
- nine_slice: none
- states: single
- visual_requirements: 前景alpha高光占杯面积约≤10%，禁止整杯深色透明遮罩。 主调#E6D1C8；画布对应世界x0..750/y200..1200；杯内缘使用该款CupGeometry导出导线，顶y1060/底y260；所有层同画布禁止各自裁切或缩放。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: spr_cup_mochi_special_front.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#spr_cup_mochi_special_front

## spr_cup_mochi_special_rim_back · 麻薯特调杯口后缘

- category: cup_layer
- first_phase: P3-A
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 1500x2000 layered; registered world origin (0,200)
- export_spec: 750x1000 PNG
- runtime_du: 750x1000
- alpha: yes
- pivot: 0,0
- nine_slice: none
- states: single
- visual_requirements: 轻椭圆后半缘，仅表现厚度，不能暗示顶部有盖。 主调#E6D1C8；画布对应世界x0..750/y200..1200；杯内缘使用该款CupGeometry导出导线，顶y1060/底y260；所有层同画布禁止各自裁切或缩放。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: spr_cup_mochi_special_rim_back.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#spr_cup_mochi_special_rim_back

## spr_cup_mochi_special_rim_front · 麻薯特调杯口前缘

- category: cup_layer
- first_phase: P3-A
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 1500x2000 layered; registered world origin (0,200)
- export_spec: 750x1000 PNG
- runtime_du: 750x1000
- alpha: yes
- pivot: 0,0
- nine_slice: none
- states: single
- visual_requirements: 前半缘薄高光，不遮危险线/落点。 主调#E6D1C8；画布对应世界x0..750/y200..1200；杯内缘使用该款CupGeometry导出导线，顶y1060/底y260；所有层同画布禁止各自裁切或缩放。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: spr_cup_mochi_special_rim_front.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#spr_cup_mochi_special_rim_front

## spr_cup_mochi_special_base · 麻薯特调杯底装饰

- category: cup_layer
- first_phase: P3-A
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 1500x2000 layered; registered world origin (0,200)
- export_spec: 750x1000 PNG
- runtime_du: 750x1000
- alpha: yes
- pivot: 0,0
- nine_slice: none
- states: single
- visual_requirements: 视觉贴合y260物理杯底，无可支撑的假凸台。 主调#E6D1C8；画布对应世界x0..750/y200..1200；杯内缘使用该款CupGeometry导出导线，顶y1060/底y260；所有层同画布禁止各自裁切或缩放。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: spr_cup_mochi_special_base.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#spr_cup_mochi_special_base

## spr_cup_mochi_special_label · 麻薯特调杯身无文字印花

- category: cup_layer
- first_phase: P3-A
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 1500x2000 layered; registered world origin (0,200)
- export_spec: 750x1000 PNG
- runtime_du: 750x1000
- alpha: yes
- pivot: 0,0
- nine_slice: none
- states: single
- visual_requirements: 原创抽象图形，动态款名另排文字，不用真实奶茶品牌。 主调#E6D1C8；画布对应世界x0..750/y200..1200；杯内缘使用该款CupGeometry导出导线，顶y1060/底y260；所有层同画布禁止各自裁切或缩放。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: spr_cup_mochi_special_label.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#spr_cup_mochi_special_label

## ui_stage_mochi_special_card · 麻薯特调菜单封面

- category: stage_select
- first_phase: P3-A
- required: required
- production_method: derived
- source_asset_id: spr_cup_mochi_special_back
- source_spec: reuse cup layers
- export_spec: 480x600 PNG
- runtime_du: 240x300
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 从该款杯图层合成，留30%区域给动态款名/纪录/解锁信息；不烘分数或锁。
- color_space: sRGB
- status: deferred
- license_status: inherits_source_or_code
- filename: ui_stage_mochi_special_card.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#ui_stage_mochi_special_card

## bg_shop_base · 奶茶店低对比背景

- category: environment
- first_phase: P1
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 1500x2668 layered
- export_spec: 750x1334 PNG
- runtime_du: 750x1334
- alpha: no
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 低细节桌面和简化店内形状，中心杯区留空，四边可延展，无品牌。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: bg_shop_base.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#bg_shop_base

## bg_shop_extend_top · 长屏顶部延展

- category: environment
- first_phase: P1
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 1500x800 layered
- export_spec: 750x400 PNG
- runtime_du: 750x400 tile-y
- alpha: no
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 上下可衔接主背景，低对比，不能出现透视接缝。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: bg_shop_extend_top.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#bg_shop_extend_top

## bg_shop_extend_bottom · 长屏底部延展

- category: environment
- first_phase: P1
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 1500x800 layered
- export_spec: 750x400 PNG
- runtime_du: 750x400 tile-y
- alpha: no
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 承接桌面，不放必需按钮或文字。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: bg_shop_extend_bottom.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#bg_shop_extend_bottom

## ui_title_logo · 奶茶挤挤原创标题字标

- category: environment
- first_phase: P1
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 1600x600 layered/vector
- export_spec: 800x300 PNG
- runtime_du: 400x150
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 标题允许艺术字；先确认字形授权，不抄品牌Logo。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: ui_title_logo.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#ui_title_logo

## spr_cup_shadow · 杯底接触阴影

- category: environment
- first_phase: P1
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 1024x256 layered
- export_spec: 512x128 PNG
- runtime_du: 520x100
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 柔边低alpha，独立于小料，不造成大透明叠层。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: spr_cup_shadow.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#spr_cup_shadow

## ui_btn_primary_normal · 主按钮 normal

- category: button_skin
- first_phase: P1
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 512x192 vector/layered
- export_spec: 256x96 PNG
- runtime_du: 360x104
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: 32,32,32,32
- states: single
- visual_requirements: 主色#8B4E2F；不含文案/图标。柔和圆角边，按钮边界清楚。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: ui_btn_primary_normal.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#ui_btn_primary_normal

## ui_btn_primary_pressed · 主按钮 pressed

- category: button_skin
- first_phase: P1
- required: required
- production_method: derived
- source_asset_id: ui_btn_primary_normal
- source_spec: 512x192 vector/layered
- export_spec: 256x96 PNG
- runtime_du: 360x104
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: 32,32,32,32
- states: single
- visual_requirements: 主色#8B4E2F；不含文案/图标。从normal降低亮度并加内阴影，缩放由程序做。
- color_space: sRGB
- status: planned
- license_status: inherits_source_or_code
- filename: ui_btn_primary_pressed.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#ui_btn_primary_pressed

## ui_btn_primary_disabled · 主按钮 disabled

- category: button_skin
- first_phase: P1
- required: required
- production_method: derived
- source_asset_id: ui_btn_primary_normal
- source_spec: 512x192 vector/layered
- export_spec: 256x96 PNG
- runtime_du: 360x104
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: 32,32,32,32
- states: single
- visual_requirements: 主色#8B4E2F；不含文案/图标。降低饱和度但仍可读，程序同时禁用点击。
- color_space: sRGB
- status: planned
- license_status: inherits_source_or_code
- filename: ui_btn_primary_disabled.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#ui_btn_primary_disabled

## ui_btn_primary_selected · 主按钮 selected

- category: button_skin
- first_phase: P1
- required: required
- production_method: derived
- source_asset_id: ui_btn_primary_normal
- source_spec: 512x192 vector/layered
- export_spec: 256x96 PNG
- runtime_du: 360x104
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: 32,32,32,32
- states: single
- visual_requirements: 主色#8B4E2F；不含文案/图标。加实线/勾选线索，不仅改颜色。
- color_space: sRGB
- status: planned
- license_status: inherits_source_or_code
- filename: ui_btn_primary_selected.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#ui_btn_primary_selected

## ui_btn_secondary_normal · 次按钮 normal

- category: button_skin
- first_phase: P1
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 512x192 vector/layered
- export_spec: 256x96 PNG
- runtime_du: 300x96
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: 28,28,28,28
- states: single
- visual_requirements: 主色#F1E2CF；不含文案/图标。柔和圆角边，按钮边界清楚。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: ui_btn_secondary_normal.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#ui_btn_secondary_normal

## ui_btn_secondary_pressed · 次按钮 pressed

- category: button_skin
- first_phase: P1
- required: required
- production_method: derived
- source_asset_id: ui_btn_secondary_normal
- source_spec: 512x192 vector/layered
- export_spec: 256x96 PNG
- runtime_du: 300x96
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: 28,28,28,28
- states: single
- visual_requirements: 主色#F1E2CF；不含文案/图标。从normal降低亮度并加内阴影，缩放由程序做。
- color_space: sRGB
- status: planned
- license_status: inherits_source_or_code
- filename: ui_btn_secondary_pressed.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#ui_btn_secondary_pressed

## ui_btn_secondary_disabled · 次按钮 disabled

- category: button_skin
- first_phase: P1
- required: required
- production_method: derived
- source_asset_id: ui_btn_secondary_normal
- source_spec: 512x192 vector/layered
- export_spec: 256x96 PNG
- runtime_du: 300x96
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: 28,28,28,28
- states: single
- visual_requirements: 主色#F1E2CF；不含文案/图标。降低饱和度但仍可读，程序同时禁用点击。
- color_space: sRGB
- status: planned
- license_status: inherits_source_or_code
- filename: ui_btn_secondary_disabled.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#ui_btn_secondary_disabled

## ui_btn_secondary_selected · 次按钮 selected

- category: button_skin
- first_phase: P1
- required: required
- production_method: derived
- source_asset_id: ui_btn_secondary_normal
- source_spec: 512x192 vector/layered
- export_spec: 256x96 PNG
- runtime_du: 300x96
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: 28,28,28,28
- states: single
- visual_requirements: 主色#F1E2CF；不含文案/图标。加实线/勾选线索，不仅改颜色。
- color_space: sRGB
- status: planned
- license_status: inherits_source_or_code
- filename: ui_btn_secondary_selected.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#ui_btn_secondary_selected

## ui_btn_icon_normal · 圆图标按钮 normal

- category: button_skin
- first_phase: P1
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 192x192 vector
- export_spec: 96x96 PNG
- runtime_du: 96x96
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: 24,24,24,24
- states: single
- visual_requirements: 主色#F1E2CF；不含文案/图标。柔和圆角边，按钮边界清楚。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: ui_btn_icon_normal.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#ui_btn_icon_normal

## ui_btn_icon_pressed · 圆图标按钮 pressed

- category: button_skin
- first_phase: P1
- required: required
- production_method: derived
- source_asset_id: ui_btn_icon_normal
- source_spec: 192x192 vector
- export_spec: 96x96 PNG
- runtime_du: 96x96
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: 24,24,24,24
- states: single
- visual_requirements: 主色#F1E2CF；不含文案/图标。从normal降低亮度并加内阴影，缩放由程序做。
- color_space: sRGB
- status: planned
- license_status: inherits_source_or_code
- filename: ui_btn_icon_pressed.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#ui_btn_icon_pressed

## ui_btn_icon_disabled · 圆图标按钮 disabled

- category: button_skin
- first_phase: P1
- required: required
- production_method: derived
- source_asset_id: ui_btn_icon_normal
- source_spec: 192x192 vector
- export_spec: 96x96 PNG
- runtime_du: 96x96
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: 24,24,24,24
- states: single
- visual_requirements: 主色#F1E2CF；不含文案/图标。降低饱和度但仍可读，程序同时禁用点击。
- color_space: sRGB
- status: planned
- license_status: inherits_source_or_code
- filename: ui_btn_icon_disabled.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#ui_btn_icon_disabled

## ui_btn_icon_selected · 圆图标按钮 selected

- category: button_skin
- first_phase: P1
- required: required
- production_method: derived
- source_asset_id: ui_btn_icon_normal
- source_spec: 192x192 vector
- export_spec: 96x96 PNG
- runtime_du: 96x96
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: 24,24,24,24
- states: single
- visual_requirements: 主色#F1E2CF；不含文案/图标。加实线/勾选线索，不仅改颜色。
- color_space: sRGB
- status: planned
- license_status: inherits_source_or_code
- filename: ui_btn_icon_selected.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#ui_btn_icon_selected

## ui_btn_tab_normal · 选项页签 normal

- category: button_skin
- first_phase: P3-A
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 512x192 vector/layered
- export_spec: 256x96 PNG
- runtime_du: 180x80
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: 20,20,20,20
- states: single
- visual_requirements: 主色#F1E2CF；不含文案/图标。柔和圆角边，按钮边界清楚。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: ui_btn_tab_normal.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#ui_btn_tab_normal

## ui_btn_tab_pressed · 选项页签 pressed

- category: button_skin
- first_phase: P3-A
- required: required
- production_method: derived
- source_asset_id: ui_btn_tab_normal
- source_spec: 512x192 vector/layered
- export_spec: 256x96 PNG
- runtime_du: 180x80
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: 20,20,20,20
- states: single
- visual_requirements: 主色#F1E2CF；不含文案/图标。从normal降低亮度并加内阴影，缩放由程序做。
- color_space: sRGB
- status: deferred
- license_status: inherits_source_or_code
- filename: ui_btn_tab_pressed.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#ui_btn_tab_pressed

## ui_btn_tab_disabled · 选项页签 disabled

- category: button_skin
- first_phase: P3-A
- required: required
- production_method: derived
- source_asset_id: ui_btn_tab_normal
- source_spec: 512x192 vector/layered
- export_spec: 256x96 PNG
- runtime_du: 180x80
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: 20,20,20,20
- states: single
- visual_requirements: 主色#F1E2CF；不含文案/图标。降低饱和度但仍可读，程序同时禁用点击。
- color_space: sRGB
- status: deferred
- license_status: inherits_source_or_code
- filename: ui_btn_tab_disabled.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#ui_btn_tab_disabled

## ui_btn_tab_selected · 选项页签 selected

- category: button_skin
- first_phase: P3-A
- required: required
- production_method: derived
- source_asset_id: ui_btn_tab_normal
- source_spec: 512x192 vector/layered
- export_spec: 256x96 PNG
- runtime_du: 180x80
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: 20,20,20,20
- states: single
- visual_requirements: 主色#F1E2CF；不含文案/图标。加实线/勾选线索，不仅改颜色。
- color_space: sRGB
- status: deferred
- license_status: inherits_source_or_code
- filename: ui_btn_tab_selected.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#ui_btn_tab_selected

## ui_icon_play · 开始三角

- category: icon
- first_phase: P1
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 192x192 SVG
- export_spec: 96x96 PNG;48x48 PNG
- runtime_du: 48x48
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 笔画在96px图至少4px；深棕主色，统一圆角；实际触摸框≥48 CSSpx；关闭/禁用变色由程序生成，不重复绘制。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: ui_icon_play.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 2
- library_index: assets/library/index.html#ui_icon_play

## ui_icon_continue · 继续箭头

- category: icon
- first_phase: P1
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 192x192 SVG
- export_spec: 96x96 PNG;48x48 PNG
- runtime_du: 48x48
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 笔画在96px图至少4px；深棕主色，统一圆角；实际触摸框≥48 CSSpx；关闭/禁用变色由程序生成，不重复绘制。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: ui_icon_continue.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 2
- library_index: assets/library/index.html#ui_icon_continue

## ui_icon_pause · 暂停双条

- category: icon
- first_phase: P1
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 192x192 SVG
- export_spec: 96x96 PNG;48x48 PNG
- runtime_du: 48x48
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 笔画在96px图至少4px；深棕主色，统一圆角；实际触摸框≥48 CSSpx；关闭/禁用变色由程序生成，不重复绘制。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: ui_icon_pause.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 2
- library_index: assets/library/index.html#ui_icon_pause

## ui_icon_settings · 设置齿轮

- category: icon
- first_phase: P1
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 192x192 SVG
- export_spec: 96x96 PNG;48x48 PNG
- runtime_du: 48x48
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 笔画在96px图至少4px；深棕主色，统一圆角；实际触摸框≥48 CSSpx；关闭/禁用变色由程序生成，不重复绘制。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: ui_icon_settings.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 2
- library_index: assets/library/index.html#ui_icon_settings

## ui_icon_close · 关闭叉

- category: icon
- first_phase: P1
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 192x192 SVG
- export_spec: 96x96 PNG;48x48 PNG
- runtime_du: 48x48
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 笔画在96px图至少4px；深棕主色，统一圆角；实际触摸框≥48 CSSpx；关闭/禁用变色由程序生成，不重复绘制。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: ui_icon_close.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 2
- library_index: assets/library/index.html#ui_icon_close

## ui_icon_back · 返回箭头

- category: icon
- first_phase: P1
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 192x192 SVG
- export_spec: 96x96 PNG;48x48 PNG
- runtime_du: 48x48
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 笔画在96px图至少4px；深棕主色，统一圆角；实际触摸框≥48 CSSpx；关闭/禁用变色由程序生成，不重复绘制。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: ui_icon_back.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 2
- library_index: assets/library/index.html#ui_icon_back

## ui_icon_restart · 重开回转箭头

- category: icon
- first_phase: P1
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 192x192 SVG
- export_spec: 96x96 PNG;48x48 PNG
- runtime_du: 48x48
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 笔画在96px图至少4px；深棕主色，统一圆角；实际触摸框≥48 CSSpx；关闭/禁用变色由程序生成，不重复绘制。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: ui_icon_restart.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 2
- library_index: assets/library/index.html#ui_icon_restart

## ui_icon_home · 主页小屋

- category: icon
- first_phase: P1
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 192x192 SVG
- export_spec: 96x96 PNG;48x48 PNG
- runtime_du: 48x48
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 笔画在96px图至少4px；深棕主色，统一圆角；实际触摸框≥48 CSSpx；关闭/禁用变色由程序生成，不重复绘制。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: ui_icon_home.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 2
- library_index: assets/library/index.html#ui_icon_home

## ui_icon_music_on · 音乐开

- category: icon
- first_phase: P1
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 192x192 SVG
- export_spec: 96x96 PNG;48x48 PNG
- runtime_du: 48x48
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 笔画在96px图至少4px；深棕主色，统一圆角；实际触摸框≥48 CSSpx；关闭/禁用变色由程序生成，不重复绘制。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: ui_icon_music_on.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 2
- library_index: assets/library/index.html#ui_icon_music_on

## ui_icon_music_off · 音乐关

- category: icon
- first_phase: P1
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 192x192 SVG
- export_spec: 96x96 PNG;48x48 PNG
- runtime_du: 48x48
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 笔画在96px图至少4px；深棕主色，统一圆角；实际触摸框≥48 CSSpx；关闭/禁用变色由程序生成，不重复绘制。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: ui_icon_music_off.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 2
- library_index: assets/library/index.html#ui_icon_music_off

## ui_icon_sfx_on · 音效开

- category: icon
- first_phase: P1
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 192x192 SVG
- export_spec: 96x96 PNG;48x48 PNG
- runtime_du: 48x48
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 笔画在96px图至少4px；深棕主色，统一圆角；实际触摸框≥48 CSSpx；关闭/禁用变色由程序生成，不重复绘制。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: ui_icon_sfx_on.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 2
- library_index: assets/library/index.html#ui_icon_sfx_on

## ui_icon_sfx_off · 音效关

- category: icon
- first_phase: P1
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 192x192 SVG
- export_spec: 96x96 PNG;48x48 PNG
- runtime_du: 48x48
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 笔画在96px图至少4px；深棕主色，统一圆角；实际触摸框≥48 CSSpx；关闭/禁用变色由程序生成，不重复绘制。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: ui_icon_sfx_off.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 2
- library_index: assets/library/index.html#ui_icon_sfx_off

## ui_icon_reduced_motion · 弱动态

- category: icon
- first_phase: P1
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 192x192 SVG
- export_spec: 96x96 PNG;48x48 PNG
- runtime_du: 48x48
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 笔画在96px图至少4px；深棕主色，统一圆角；实际触摸框≥48 CSSpx；关闭/禁用变色由程序生成，不重复绘制。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: ui_icon_reduced_motion.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 2
- library_index: assets/library/index.html#ui_icon_reduced_motion

## ui_icon_shake · 晃杯动作

- category: icon
- first_phase: P1
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 192x192 SVG
- export_spec: 96x96 PNG;48x48 PNG
- runtime_du: 48x48
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 笔画在96px图至少4px；深棕主色，统一圆角；实际触摸框≥48 CSSpx；关闭/禁用变色由程序生成，不重复绘制。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: ui_icon_shake.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 2
- library_index: assets/library/index.html#ui_icon_shake

## ui_icon_info · 说明

- category: icon
- first_phase: P1
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 192x192 SVG
- export_spec: 96x96 PNG;48x48 PNG
- runtime_du: 48x48
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 笔画在96px图至少4px；深棕主色，统一圆角；实际触摸框≥48 CSSpx；关闭/禁用变色由程序生成，不重复绘制。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: ui_icon_info.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 2
- library_index: assets/library/index.html#ui_icon_info

## ui_icon_warning · 危险提示

- category: icon
- first_phase: P1
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 192x192 SVG
- export_spec: 96x96 PNG;48x48 PNG
- runtime_du: 48x48
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 笔画在96px图至少4px；深棕主色，统一圆角；实际触摸框≥48 CSSpx；关闭/禁用变色由程序生成，不重复绘制。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: ui_icon_warning.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 2
- library_index: assets/library/index.html#ui_icon_warning

## ui_icon_check · 确认勾

- category: icon
- first_phase: P1
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 192x192 SVG
- export_spec: 96x96 PNG;48x48 PNG
- runtime_du: 48x48
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 笔画在96px图至少4px；深棕主色，统一圆角；实际触摸框≥48 CSSpx；关闭/禁用变色由程序生成，不重复绘制。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: ui_icon_check.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 2
- library_index: assets/library/index.html#ui_icon_check

## ui_icon_next · 下一个箭头

- category: icon
- first_phase: P1
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 192x192 SVG
- export_spec: 96x96 PNG;48x48 PNG
- runtime_du: 48x48
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 笔画在96px图至少4px；深棕主色，统一圆角；实际触摸框≥48 CSSpx；关闭/禁用变色由程序生成，不重复绘制。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: ui_icon_next.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 2
- library_index: assets/library/index.html#ui_icon_next

## ui_icon_record · 录屏

- category: icon
- first_phase: P2
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 192x192 SVG
- export_spec: 96x96 PNG;48x48 PNG
- runtime_du: 48x48
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 笔画在96px图至少4px；深棕主色，统一圆角；实际触摸框≥48 CSSpx；关闭/禁用变色由程序生成，不重复绘制。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: ui_icon_record.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 2
- library_index: assets/library/index.html#ui_icon_record

## ui_icon_publish · 发布作品

- category: icon
- first_phase: P2
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 192x192 SVG
- export_spec: 96x96 PNG;48x48 PNG
- runtime_du: 48x48
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 笔画在96px图至少4px；深棕主色，统一圆角；实际触摸框≥48 CSSpx；关闭/禁用变色由程序生成，不重复绘制。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: ui_icon_publish.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 2
- library_index: assets/library/index.html#ui_icon_publish

## ui_icon_sidebar · 侧边栏复访提示

- category: icon
- first_phase: P2
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 192x192 SVG
- export_spec: 96x96 PNG;48x48 PNG
- runtime_du: 48x48
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 笔画在96px图至少4px；深棕主色，统一圆角；实际触摸框≥48 CSSpx；使用原创提示图，不伪造平台官方Logo或认证。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: ui_icon_sidebar.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 2
- library_index: assets/library/index.html#ui_icon_sidebar

## ui_icon_lock · 未解锁锁

- category: icon
- first_phase: P3-A
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 192x192 SVG
- export_spec: 96x96 PNG;48x48 PNG
- runtime_du: 48x48
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 笔画在96px图至少4px；深棕主色，统一圆角；实际触摸框≥48 CSSpx；关闭/禁用变色由程序生成，不重复绘制。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: ui_icon_lock.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 2
- library_index: assets/library/index.html#ui_icon_lock

## ui_icon_unlock · 解锁锁

- category: icon
- first_phase: P3-A
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 192x192 SVG
- export_spec: 96x96 PNG;48x48 PNG
- runtime_du: 48x48
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 笔画在96px图至少4px；深棕主色，统一圆角；实际触摸框≥48 CSSpx；关闭/禁用变色由程序生成，不重复绘制。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: ui_icon_unlock.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 2
- library_index: assets/library/index.html#ui_icon_unlock

## ui_icon_cloud · 云存档

- category: icon
- first_phase: P3-A
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 192x192 SVG
- export_spec: 96x96 PNG;48x48 PNG
- runtime_du: 48x48
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 笔画在96px图至少4px；深棕主色，统一圆角；实际触摸框≥48 CSSpx；关闭/禁用变色由程序生成，不重复绘制。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: ui_icon_cloud.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 2
- library_index: assets/library/index.html#ui_icon_cloud

## ui_icon_sync · 同步

- category: icon
- first_phase: P3-A
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 192x192 SVG
- export_spec: 96x96 PNG;48x48 PNG
- runtime_du: 48x48
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 笔画在96px图至少4px；深棕主色，统一圆角；实际触摸框≥48 CSSpx；关闭/禁用变色由程序生成，不重复绘制。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: ui_icon_sync.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 2
- library_index: assets/library/index.html#ui_icon_sync

## ui_icon_offline · 离线

- category: icon
- first_phase: P3-A
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 192x192 SVG
- export_spec: 96x96 PNG;48x48 PNG
- runtime_du: 48x48
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 笔画在96px图至少4px；深棕主色，统一圆角；实际触摸框≥48 CSSpx；关闭/禁用变色由程序生成，不重复绘制。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: ui_icon_offline.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 2
- library_index: assets/library/index.html#ui_icon_offline

## ui_icon_account · 账号默认

- category: icon
- first_phase: P3-A
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 192x192 SVG
- export_spec: 96x96 PNG;48x48 PNG
- runtime_du: 48x48
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 笔画在96px图至少4px；深棕主色，统一圆角；实际触摸框≥48 CSSpx；关闭/禁用变色由程序生成，不重复绘制。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: ui_icon_account.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 2
- library_index: assets/library/index.html#ui_icon_account

## ui_icon_coupon · 晃杯券

- category: icon
- first_phase: P3-B
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 192x192 SVG
- export_spec: 96x96 PNG;48x48 PNG
- runtime_du: 48x48
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 笔画在96px图至少4px；深棕主色，统一圆角；实际触摸框≥48 CSSpx；关闭/禁用变色由程序生成，不重复绘制。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: ui_icon_coupon.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 2
- library_index: assets/library/index.html#ui_icon_coupon

## ui_icon_rank · 排行榜

- category: icon
- first_phase: P3-B
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 192x192 SVG
- export_spec: 96x96 PNG;48x48 PNG
- runtime_du: 48x48
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 笔画在96px图至少4px；深棕主色，统一圆角；实际触摸框≥48 CSSpx；关闭/禁用变色由程序生成，不重复绘制。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: ui_icon_rank.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 2
- library_index: assets/library/index.html#ui_icon_rank

## ui_icon_share · 分享

- category: icon
- first_phase: P3-B
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 192x192 SVG
- export_spec: 96x96 PNG;48x48 PNG
- runtime_du: 48x48
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 笔画在96px图至少4px；深棕主色，统一圆角；实际触摸框≥48 CSSpx；关闭/禁用变色由程序生成，不重复绘制。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: ui_icon_share.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 2
- library_index: assets/library/index.html#ui_icon_share

## ui_icon_standard · 标准局标识

- category: icon
- first_phase: P3-B
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 192x192 SVG
- export_spec: 96x96 PNG;48x48 PNG
- runtime_du: 48x48
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 笔画在96px图至少4px；深棕主色，统一圆角；实际触摸框≥48 CSSpx；关闭/禁用变色由程序生成，不重复绘制。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: ui_icon_standard.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 2
- library_index: assets/library/index.html#ui_icon_standard

## ui_icon_assisted · 助力局标识

- category: icon
- first_phase: P3-B
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 192x192 SVG
- export_spec: 96x96 PNG;48x48 PNG
- runtime_du: 48x48
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 笔画在96px图至少4px；深棕主色，统一圆角；实际触摸框≥48 CSSpx；关闭/禁用变色由程序生成，不重复绘制。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: ui_icon_assisted.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 2
- library_index: assets/library/index.html#ui_icon_assisted

## ui_icon_verified · 核验通过

- category: icon
- first_phase: P3-B
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 192x192 SVG
- export_spec: 96x96 PNG;48x48 PNG
- runtime_du: 48x48
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 笔画在96px图至少4px；深棕主色，统一圆角；实际触摸框≥48 CSSpx；使用原创提示图，不伪造平台官方Logo或认证。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: ui_icon_verified.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 2
- library_index: assets/library/index.html#ui_icon_verified

## ui_icon_pending · 核验中

- category: icon
- first_phase: P3-B
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 192x192 SVG
- export_spec: 96x96 PNG;48x48 PNG
- runtime_du: 48x48
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 笔画在96px图至少4px；深棕主色，统一圆角；实际触摸框≥48 CSSpx；关闭/禁用变色由程序生成，不重复绘制。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: ui_icon_pending.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 2
- library_index: assets/library/index.html#ui_icon_pending

## ui_icon_calendar · 每日挑战

- category: icon
- first_phase: P4-A
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 192x192 SVG
- export_spec: 96x96 PNG;48x48 PNG
- runtime_du: 48x48
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 笔画在96px图至少4px；深棕主色，统一圆角；实际触摸框≥48 CSSpx；关闭/禁用变色由程序生成，不重复绘制。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: ui_icon_calendar.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 2
- library_index: assets/library/index.html#ui_icon_calendar

## ui_icon_friend · 好友挑战

- category: icon
- first_phase: P4-A
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 192x192 SVG
- export_spec: 96x96 PNG;48x48 PNG
- runtime_du: 48x48
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 笔画在96px图至少4px；深棕主色，统一圆角；实际触摸框≥48 CSSpx；关闭/禁用变色由程序生成，不重复绘制。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: ui_icon_friend.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 2
- library_index: assets/library/index.html#ui_icon_friend

## ui_icon_win · 领先标识

- category: icon
- first_phase: P4-A
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 192x192 SVG
- export_spec: 96x96 PNG;48x48 PNG
- runtime_du: 48x48
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 笔画在96px图至少4px；深棕主色，统一圆角；实际触摸框≥48 CSSpx；关闭/禁用变色由程序生成，不重复绘制。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: ui_icon_win.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 2
- library_index: assets/library/index.html#ui_icon_win

## ui_icon_tie · 平局标识

- category: icon
- first_phase: P4-A
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 192x192 SVG
- export_spec: 96x96 PNG;48x48 PNG
- runtime_du: 48x48
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 笔画在96px图至少4px；深棕主色，统一圆角；实际触摸框≥48 CSSpx；关闭/禁用变色由程序生成，不重复绘制。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: ui_icon_tie.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 2
- library_index: assets/library/index.html#ui_icon_tie

## ui_icon_loss · 落后标识

- category: icon
- first_phase: P4-A
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 192x192 SVG
- export_spec: 96x96 PNG;48x48 PNG
- runtime_du: 48x48
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 笔画在96px图至少4px；深棕主色，统一圆角；实际触摸框≥48 CSSpx；关闭/禁用变色由程序生成，不重复绘制。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: ui_icon_loss.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 2
- library_index: assets/library/index.html#ui_icon_loss

## ui_icon_album · 图鉴

- category: icon
- first_phase: P4-B
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 192x192 SVG
- export_spec: 96x96 PNG;48x48 PNG
- runtime_du: 48x48
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 笔画在96px图至少4px；深棕主色，统一圆角；实际触摸框≥48 CSSpx；关闭/禁用变色由程序生成，不重复绘制。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: ui_icon_album.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 2
- library_index: assets/library/index.html#ui_icon_album

## ui_icon_achievement · 成就

- category: icon
- first_phase: P4-B
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 192x192 SVG
- export_spec: 96x96 PNG;48x48 PNG
- runtime_du: 48x48
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 笔画在96px图至少4px；深棕主色，统一圆角；实际触摸框≥48 CSSpx；关闭/禁用变色由程序生成，不重复绘制。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: ui_icon_achievement.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 2
- library_index: assets/library/index.html#ui_icon_achievement

## ui_icon_skin · 外观

- category: icon
- first_phase: P4-B
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 192x192 SVG
- export_spec: 96x96 PNG;48x48 PNG
- runtime_du: 48x48
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 笔画在96px图至少4px；深棕主色，统一圆角；实际触摸框≥48 CSSpx；关闭/禁用变色由程序生成，不重复绘制。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: ui_icon_skin.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 2
- library_index: assets/library/index.html#ui_icon_skin

## ui_icon_ad_play · 自愿看视频

- category: icon
- first_phase: P4-C
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 192x192 SVG
- export_spec: 96x96 PNG;48x48 PNG
- runtime_du: 48x48
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 笔画在96px图至少4px；深棕主色，统一圆角；实际触摸框≥48 CSSpx；关闭/禁用变色由程序生成，不重复绘制。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: ui_icon_ad_play.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 2
- library_index: assets/library/index.html#ui_icon_ad_play

## ui_icon_external · 外链提示

- category: icon
- first_phase: P4-D
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 192x192 SVG
- export_spec: 96x96 PNG;48x48 PNG
- runtime_du: 48x48
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 笔画在96px图至少4px；深棕主色，统一圆角；实际触摸框≥48 CSSpx；关闭/禁用变色由程序生成，不重复绘制。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: ui_icon_external.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 2
- library_index: assets/library/index.html#ui_icon_external

## ui_panel_modal · 通用弹窗底

- category: panel
- first_phase: P1
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 2x export layered/vector
- export_spec: 320x360 PNG
- runtime_du: 640x720
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: 32,32,32,32
- states: single
- visual_requirements: 圆角奶油纸感，低频纹理；内部留白24DU以上，标题/数值/头像全部由程序填。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: ui_panel_modal.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#ui_panel_modal

## ui_panel_hud · HUD底

- category: panel
- first_phase: P1
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 2x export layered/vector
- export_spec: 340x60 PNG
- runtime_du: 680x120
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: 20,20,20,20
- states: single
- visual_requirements: 圆角奶油纸感，低频纹理；内部留白24DU以上，标题/数值/头像全部由程序填。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: ui_panel_hud.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#ui_panel_hud

## ui_panel_next · 下一份预告框

- category: panel
- first_phase: P1
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 2x export layered/vector
- export_spec: 140x140 PNG
- runtime_du: 140x140
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: 24,24,24,24
- states: single
- visual_requirements: 圆角奶油纸感，低频纹理；内部留白24DU以上，标题/数值/头像全部由程序填。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: ui_panel_next.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#ui_panel_next

## ui_panel_toast · 短提示底

- category: panel
- first_phase: P1
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 2x export layered/vector
- export_spec: 250x40 PNG
- runtime_du: 500x80
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: 16,16,16,16
- states: single
- visual_requirements: 圆角奶油纸感，低频纹理；内部留白24DU以上，标题/数值/头像全部由程序填。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: ui_panel_toast.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#ui_panel_toast

## ui_panel_results · 结算面板

- category: panel
- first_phase: P1
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 2x export layered/vector
- export_spec: 330x410 PNG
- runtime_du: 660x820
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: 36,36,36,36
- states: single
- visual_requirements: 圆角奶油纸感，低频纹理；内部留白24DU以上，标题/数值/头像全部由程序填。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: ui_panel_results.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#ui_panel_results

## ui_panel_stage · 关卡卡片底

- category: panel
- first_phase: P3-A
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 2x export layered/vector
- export_spec: 280x400 PNG
- runtime_du: 280x400
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: 24,24,24,24
- states: single
- visual_requirements: 圆角奶油纸感，低频纹理；内部留白24DU以上，标题/数值/头像全部由程序填。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: ui_panel_stage.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#ui_panel_stage

## ui_panel_rank_row · 排行行底

- category: panel
- first_phase: P3-B
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 2x export layered/vector
- export_spec: 330x48 PNG
- runtime_du: 660x96
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: 12,12,12,12
- states: single
- visual_requirements: 圆角奶油纸感，低频纹理；内部留白24DU以上，标题/数值/头像全部由程序填。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: ui_panel_rank_row.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#ui_panel_rank_row

## ui_panel_rank_self · 本人排行行高亮

- category: panel
- first_phase: P3-B
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 2x export layered/vector
- export_spec: 330x48 PNG
- runtime_du: 660x96
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: 12,12,12,12
- states: single
- visual_requirements: 圆角奶油纸感，低频纹理；内部留白24DU以上，标题/数值/头像全部由程序填。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: ui_panel_rank_self.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#ui_panel_rank_self

## ui_panel_challenge · 挑战卡底

- category: panel
- first_phase: P4-A
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 2x export layered/vector
- export_spec: 330x200 PNG
- runtime_du: 660x400
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: 24,24,24,24
- states: single
- visual_requirements: 圆角奶油纸感，低频纹理；内部留白24DU以上，标题/数值/头像全部由程序填。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: ui_panel_challenge.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#ui_panel_challenge

## ui_panel_collection · 图鉴格底

- category: panel
- first_phase: P4-B
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 2x export layered/vector
- export_spec: 180x210 PNG
- runtime_du: 180x210
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: 16,16,16,16
- states: single
- visual_requirements: 圆角奶油纸感，低频纹理；内部留白24DU以上，标题/数值/头像全部由程序填。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: ui_panel_collection.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#ui_panel_collection

## ui_toggle_track · 开关轨道

- category: ui_detail
- first_phase: P1
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 2x export layered/vector
- export_spec: 128x64 PNG
- runtime_du: 96x48
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 开关开/关用程序颜色与圆钮位置，不仅用颜色说明。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: ui_toggle_track.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#ui_toggle_track

## ui_toggle_knob · 开关圆钮

- category: ui_detail
- first_phase: P1
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 2x export layered/vector
- export_spec: 64x64 PNG
- runtime_du: 40x40
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 边缘清楚，移动由程序控制。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: ui_toggle_knob.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#ui_toggle_knob

## ui_slider_track · 音量滑杆轨道

- category: ui_detail
- first_phase: P1
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 2x export layered/vector
- export_spec: 256x24 PNG
- runtime_du: 260x12
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 平直，两端圆角，可横向九切。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: ui_slider_track.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#ui_slider_track

## ui_slider_knob · 音量滑杆圆钮

- category: ui_detail
- first_phase: P1
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 2x export layered/vector
- export_spec: 64x64 PNG
- runtime_du: 44x44
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 触摸框另放大，不改变视觉半径。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: ui_slider_knob.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#ui_slider_knob

## ui_badge_record · 新纪录徽章

- category: ui_detail
- first_phase: P1
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 2x export layered/vector
- export_spec: 256x128 PNG
- runtime_du: 128x64
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 不含“新纪录”文字，图形为原创星章。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: ui_badge_record.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#ui_badge_record

## ui_badge_mochi · 首次麻薯徽章

- category: ui_detail
- first_phase: P1
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 2x export layered/vector
- export_spec: 192x192 PNG
- runtime_du: 96x96
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 仅里程碑装饰，不暗示游戏胜利结束。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: ui_badge_mochi.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#ui_badge_mochi

## ui_avatar_default · 默认玩家头像

- category: ui_detail
- first_phase: P3-B
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 2x export layered/vector
- export_spec: 256x256 PNG
- runtime_du: 80x80
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 原创奶茶图案，圆形安全区90%，不得使用真人肖像。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: ui_avatar_default.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#ui_avatar_default

## ui_medal_gold · 排行第一奖牌

- category: ui_detail
- first_phase: P3-B
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 2x export layered/vector
- export_spec: 128x128 PNG
- runtime_du: 64x64
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 金色与独特轮廓，数字动态排。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: ui_medal_gold.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#ui_medal_gold

## ui_medal_silver · 排行第二奖牌

- category: ui_detail
- first_phase: P3-B
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 2x export layered/vector
- export_spec: 128x128 PNG
- runtime_du: 64x64
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 银色。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: ui_medal_silver.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#ui_medal_silver

## ui_medal_bronze · 排行第三奖牌

- category: ui_detail
- first_phase: P3-B
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 2x export layered/vector
- export_spec: 128x128 PNG
- runtime_du: 64x64
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 铜色，平分按rank显示。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: ui_medal_bronze.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#ui_medal_bronze

## ui_coupon_ticket · 晃杯券票面

- category: ui_detail
- first_phase: P3-B
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 2x export layered/vector
- export_spec: 480x240 PNG
- runtime_du: 240x120
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 虚线票口；不画固定余额/倒计时/5次承诺。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: ui_coupon_ticket.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#ui_coupon_ticket

## ui_badge_discovered · 图鉴已发现角标

- category: ui_detail
- first_phase: P4-B
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 2x export layered/vector
- export_spec: 96x96 PNG
- runtime_du: 48x48
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 用勾/星轮廓区分，不仅改色。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: ui_badge_discovered.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#ui_badge_discovered

## ui_badge_achievement · 通用成就章

- category: ui_detail
- first_phase: P4-B
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 2x export layered/vector
- export_spec: 192x192 PNG
- runtime_du: 96x96
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 动态成就名称另排。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: ui_badge_achievement.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#ui_badge_achievement

## fx_merge_ring · 合成柔光环

- category: effect
- first_phase: P1
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 512x512 layered
- export_spec: 256x256 PNG
- runtime_du: 16..320 by effect
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 透明中心、软边奶白环，扩散和透明度程序动画。 同时粒子初始预算48，弱动态减量；不制作逐帧大图集，程序驱动尺寸/alpha。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: fx_merge_ring.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#fx_merge_ring

## fx_sparkle · 短星光

- category: effect
- first_phase: P1
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 512x512 layered
- export_spec: 256x256 PNG
- runtime_du: 16..320 by effect
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 四角柔光星，尺寸小，不画大面积纯白。 同时粒子初始预算48，弱动态减量；不制作逐帧大图集，程序驱动尺寸/alpha。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: fx_sparkle.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#fx_sparkle

## fx_crumb · 食材细屑

- category: effect
- first_phase: P1
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 512x512 layered
- export_spec: 256x256 PNG
- runtime_du: 16..320 by effect
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 圆润单粒，可程序着色；不能误认成可合成实体。 同时粒子初始预算48，弱动态减量；不制作逐帧大图集，程序驱动尺寸/alpha。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: fx_crumb.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#fx_crumb

## fx_drop_ping · 投放确认光点

- category: effect
- first_phase: P1
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 512x512 layered
- export_spec: 256x256 PNG
- runtime_du: 16..320 by effect
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 短弧/点形，中心透明，不遮下落轮廓。 同时粒子初始预算48，弱动态减量；不制作逐帧大图集，程序驱动尺寸/alpha。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: fx_drop_ping.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#fx_drop_ping

## fx_mochi_star · 麻薯里程碑星

- category: effect
- first_phase: P1
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 512x512 layered
- export_spec: 256x256 PNG
- runtime_du: 16..320 by effect
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 圆润星形，≤900ms局部特效，不盖杯口。 同时粒子初始预算48，弱动态减量；不制作逐帧大图集，程序驱动尺寸/alpha。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: fx_mochi_star.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#fx_mochi_star

## fx_unlock_glow · 解锁卡片亮边

- category: effect
- first_phase: P3-A
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 512x512 layered
- export_spec: 256x256 PNG
- runtime_du: 16..320 by effect
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 圆角卡边软光，中心透明，P3再用。 同时粒子初始预算48，弱动态减量；不制作逐帧大图集，程序驱动尺寸/alpha。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: fx_unlock_glow.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#fx_unlock_glow

## ui_tutorial_hand_move · 引导手指移动

- category: tutorial
- first_phase: P1
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 512x512 vector/layered
- export_spec: 256x256 PNG
- runtime_du: 256x256
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 单手指和横向运动箭头分层，适配左右拖动。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: ui_tutorial_hand_move.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#ui_tutorial_hand_move

## ui_tutorial_hand_release · 引导松手

- category: tutorial
- first_phase: P1
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 512x512 vector/layered
- export_spec: 256x256 PNG
- runtime_du: 256x256
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 手指与小料间留空，表达松开而非猛点。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: ui_tutorial_hand_release.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#ui_tutorial_hand_release

## ui_tutorial_merge_example · 两同级合成示例

- category: tutorial
- first_phase: P1
- required: required
- production_method: engine
- source_asset_id: 
- source_spec: 512x512 vector/layered
- export_spec: none
- runtime_du: 256x256
- alpha: yes
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 只画布局背景，三个小料引用已有缩略图与动态箭头。
- color_space: sRGB
- status: planned
- license_status: inherits_source_or_code
- filename: (runtime)
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: engine_source_only
- available_exports: 0
- library_index: assets/library/index.html#ui_tutorial_merge_example

## gen_danger_line · 警戒线

- category: engine_generated
- first_phase: P1
- required: required
- production_method: engine
- source_asset_id: 
- source_spec: none
- export_spec: none
- runtime_du: layout-dependent
- alpha: yes
- pivot: layout
- nine_slice: none
- states: single
- visual_requirements: y=1000世界高度，虚线/倒计时程序绘制，平时淡，危险≤2Hz呼吸。
- color_space: sRGB
- status: planned
- license_status: inherits_source_or_code
- filename: (runtime)
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: engine_source_only
- available_exports: 0
- library_index: assets/library/index.html#gen_danger_line

## gen_drop_guide · 落点虚线

- category: engine_generated
- first_phase: P1
- required: required
- production_method: engine
- source_asset_id: 
- source_spec: none
- export_spec: none
- runtime_du: layout-dependent
- alpha: yes
- pivot: layout
- nine_slice: none
- states: single
- visual_requirements: 从预览到杯内可落点，随x更新，不是实体/不改变物理。
- color_space: sRGB
- status: planned
- license_status: inherits_source_or_code
- filename: (runtime)
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: engine_source_only
- available_exports: 0
- library_index: assets/library/index.html#gen_drop_guide

## gen_score_text · 当前分/飘分/纪录

- category: engine_generated
- first_phase: P1
- required: required
- production_method: engine
- source_asset_id: 
- source_spec: none
- export_spec: none
- runtime_du: layout-dependent
- alpha: yes
- pivot: layout
- nine_slice: none
- states: single
- visual_requirements: 动态字体，整数，弱动态可关飘分；不能烘到图。
- color_space: sRGB
- status: planned
- license_status: inherits_source_or_code
- filename: (runtime)
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: engine_source_only
- available_exports: 0
- library_index: assets/library/index.html#gen_score_text

## gen_danger_countdown · 三秒倒计时

- category: engine_generated
- first_phase: P1
- required: required
- production_method: engine
- source_asset_id: 
- source_spec: none
- export_spec: none
- runtime_du: layout-dependent
- alpha: yes
- pivot: layout
- nine_slice: none
- states: single
- visual_requirements: 根据180tick剩余生成数字，暂停不走。
- color_space: sRGB
- status: planned
- license_status: inherits_source_or_code
- filename: (runtime)
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: engine_source_only
- available_exports: 0
- library_index: assets/library/index.html#gen_danger_countdown

## gen_shake_count · 晃杯剩余和冷却

- category: engine_generated
- first_phase: P1
- required: required
- production_method: engine
- source_asset_id: 
- source_spec: none
- export_spec: none
- runtime_du: layout-dependent
- alpha: yes
- pivot: layout
- nine_slice: none
- states: single
- visual_requirements: 动态数字/进度，区别基础与券；0不做假的可点状态。
- color_space: sRGB
- status: planned
- license_status: inherits_source_or_code
- filename: (runtime)
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: engine_source_only
- available_exports: 0
- library_index: assets/library/index.html#gen_shake_count

## gen_modal_dim · 弹窗遮罩

- category: engine_generated
- first_phase: P1
- required: required
- production_method: engine
- source_asset_id: 
- source_spec: none
- export_spec: none
- runtime_du: layout-dependent
- alpha: yes
- pivot: layout
- nine_slice: none
- states: single
- visual_requirements: 引擎纯色矩形alpha，拦触摸；无须整屏PNG。
- color_space: sRGB
- status: planned
- license_status: inherits_source_or_code
- filename: (runtime)
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: engine_source_only
- available_exports: 0
- library_index: assets/library/index.html#gen_modal_dim

## gen_loading_spinner · 加载转圈

- category: engine_generated
- first_phase: P1
- required: required
- production_method: engine
- source_asset_id: 
- source_spec: none
- export_spec: none
- runtime_du: layout-dependent
- alpha: yes
- pivot: layout
- nine_slice: none
- states: single
- visual_requirements: 程序绘线或复用sync图标旋转，弱动态静态文案。
- color_space: sRGB
- status: planned
- license_status: inherits_source_or_code
- filename: (runtime)
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: engine_source_only
- available_exports: 0
- library_index: assets/library/index.html#gen_loading_spinner

## gen_skeleton · 异步列表骨架

- category: engine_generated
- first_phase: P3-A
- required: required
- production_method: engine
- source_asset_id: 
- source_spec: none
- export_spec: none
- runtime_du: layout-dependent
- alpha: yes
- pivot: layout
- nine_slice: none
- states: single
- visual_requirements: 引擎圆角矩形，内容加载失败替换错误页。
- color_space: sRGB
- status: deferred
- license_status: inherits_source_or_code
- filename: (runtime)
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: engine_source_only
- available_exports: 0
- library_index: assets/library/index.html#gen_skeleton

## gen_locked_overlay · 未解锁卡遮罩

- category: engine_generated
- first_phase: P3-A
- required: required
- production_method: engine
- source_asset_id: 
- source_spec: none
- export_spec: none
- runtime_du: layout-dependent
- alpha: yes
- pivot: layout
- nine_slice: none
- states: single
- visual_requirements: 程序灰度/透明底+lock，阈值动态显示。
- color_space: sRGB
- status: deferred
- license_status: inherits_source_or_code
- filename: (runtime)
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: engine_source_only
- available_exports: 0
- library_index: assets/library/index.html#gen_locked_overlay

## gen_leaderboard_rank · 榜单名次/超过比例

- category: engine_generated
- first_phase: P3-B
- required: required
- production_method: engine
- source_asset_id: 
- source_spec: none
- export_spec: none
- runtime_du: layout-dependent
- alpha: yes
- pivot: layout
- nine_slice: none
- states: single
- visual_requirements: 动态rank文本，同分并列，不手绘固定数值。
- color_space: sRGB
- status: deferred
- license_status: inherits_source_or_code
- filename: (runtime)
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: engine_source_only
- available_exports: 0
- library_index: assets/library/index.html#gen_leaderboard_rank

## gen_coupon_expiry · 券余额/到期文本

- category: engine_generated
- first_phase: P3-B
- required: required
- production_method: engine
- source_asset_id: 
- source_spec: none
- export_spec: none
- runtime_du: layout-dependent
- alpha: yes
- pivot: layout
- nine_slice: none
- states: single
- visual_requirements: serverTime计算显示，北京24点到期。
- color_space: sRGB
- status: deferred
- license_status: inherits_source_or_code
- filename: (runtime)
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: engine_source_only
- available_exports: 0
- library_index: assets/library/index.html#gen_coupon_expiry

## gen_daily_budget · 120投进度条

- category: engine_generated
- first_phase: P4-A
- required: required
- production_method: engine
- source_asset_id: 
- source_spec: none
- export_spec: none
- runtime_du: layout-dependent
- alpha: yes
- pivot: layout
- nine_slice: none
- states: single
- visual_requirements: 动态0..120，不得显示无上限。
- color_space: sRGB
- status: deferred
- license_status: inherits_source_or_code
- filename: (runtime)
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: engine_source_only
- available_exports: 0
- library_index: assets/library/index.html#gen_daily_budget

## gen_challenge_status · 挑战待定/领先/平局/落后

- category: engine_generated
- first_phase: P4-A
- required: required
- production_method: engine
- source_asset_id: 
- source_spec: none
- export_spec: none
- runtime_du: layout-dependent
- alpha: yes
- pivot: layout
- nine_slice: none
- states: single
- visual_requirements: 图标复用win/tie/loss，文本由实际核验状态决定。
- color_space: sRGB
- status: deferred
- license_status: inherits_source_or_code
- filename: (runtime)
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: engine_source_only
- available_exports: 0
- library_index: assets/library/index.html#gen_challenge_status

## gen_album_question · 未发现问号

- category: engine_generated
- first_phase: P4-B
- required: required
- production_method: engine
- source_asset_id: 
- source_spec: none
- export_spec: none
- runtime_du: layout-dependent
- alpha: yes
- pivot: layout
- nine_slice: none
- states: single
- visual_requirements: 动态字形叠剪影；不画假隐藏第10级。
- color_space: sRGB
- status: deferred
- license_status: inherits_source_or_code
- filename: (runtime)
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: engine_source_only
- available_exports: 0
- library_index: assets/library/index.html#gen_album_question

## gen_error_empty · 空/错/无网络状态组合

- category: engine_generated
- first_phase: P3-A
- required: required
- production_method: engine
- source_asset_id: 
- source_spec: none
- export_spec: none
- runtime_du: layout-dependent
- alpha: yes
- pivot: layout
- nine_slice: none
- states: single
- visual_requirements: 复用info/offline/icon +动态文案+重试按钮，无额外插画必需。
- color_space: sRGB
- status: deferred
- license_status: inherits_source_or_code
- filename: (runtime)
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: engine_source_only
- available_exports: 0
- library_index: assets/library/index.html#gen_error_empty

## platform_user_avatar · 授权玩家头像

- category: platform_provided
- first_phase: P3-B
- required: required
- production_method: platform
- source_asset_id: 
- source_spec: provider-specified
- export_spec: provider-specified
- runtime_du: provider-specified
- alpha: provider
- pivot: provider
- nine_slice: none
- states: single
- visual_requirements: 仅实际授权URL，加载失败用ui_avatar_default；不预制真实人图。
- color_space: sRGB
- status: deferred
- license_status: inherits_source_or_code
- filename: (runtime)
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: platform_dependency
- available_exports: 0
- library_index: assets/library/index.html#platform_user_avatar

## platform_share_entry_code · 真实游戏入口码

- category: platform_provided
- first_phase: P3-B
- required: required
- production_method: platform
- source_asset_id: 
- source_spec: provider-specified
- export_spec: provider-specified
- runtime_du: provider-specified
- alpha: provider
- pivot: provider
- nine_slice: none
- states: single
- visual_requirements: 平台真实生成并确认可用，无授权不绘制假的码。
- color_space: sRGB
- status: deferred
- license_status: inherits_source_or_code
- filename: (runtime)
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: platform_dependency
- available_exports: 0
- library_index: assets/library/index.html#platform_share_entry_code

## platform_challenge_entry_code · 真实挑战入口码

- category: platform_provided
- first_phase: P4-A
- required: required
- production_method: platform
- source_asset_id: 
- source_spec: provider-specified
- export_spec: provider-specified
- runtime_du: provider-specified
- alpha: provider
- pivot: provider
- nine_slice: none
- states: single
- visual_requirements: 服务端/平台按真实challengeId生成，不手绘假二维码。
- color_space: sRGB
- status: deferred
- license_status: inherits_source_or_code
- filename: (runtime)
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: platform_dependency
- available_exports: 0
- library_index: assets/library/index.html#platform_challenge_entry_code

## platform_ad_badge · 平台广告标识

- category: platform_provided
- first_phase: P4-C
- required: required
- production_method: platform
- source_asset_id: 
- source_spec: provider-specified
- export_spec: provider-specified
- runtime_du: provider-specified
- alpha: provider
- pivot: provider
- nine_slice: none
- states: single
- visual_requirements: 由SDK或官方许可规范提供，不自行模仿。
- color_space: sRGB
- status: deferred
- license_status: inherits_source_or_code
- filename: (runtime)
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: platform_dependency
- available_exports: 0
- library_index: assets/library/index.html#platform_ad_badge

## platform_platform_review_logo · 发行平台规定标志

- category: platform_provided
- first_phase: P4-D
- required: required
- production_method: platform
- source_asset_id: 
- source_spec: provider-specified
- export_spec: provider-specified
- runtime_du: provider-specified
- alpha: provider
- pivot: provider
- nine_slice: none
- states: single
- visual_requirements: 仅平台当前要求且允许时使用，尺寸按实际模板再导出。
- color_space: sRGB
- status: deferred
- license_status: inherits_source_or_code
- filename: (runtime)
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: platform_dependency
- available_exports: 0
- library_index: assets/library/index.html#platform_platform_review_logo

## share_result_background · 普通成绩分享卡

- category: share_template
- first_phase: P3-B
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 1500x2000 layered
- export_spec: 750x1000 PNG
- runtime_du: 750x1000
- alpha: no
- pivot: 0,0
- nine_slice: none
- states: single
- visual_requirements: 保留杯截图、分数、最高小料、奶茶款、标准/助力和入口位。 文字、头像、真实截图、二维码均运行时合成，四边留48px，底部入口留180px；平台实际尺寸另导出。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: share_result_background.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#share_result_background

## share_record_background · 新纪录分享卡

- category: share_template
- first_phase: P3-B
- required: required
- production_method: derived
- source_asset_id: share_result_background
- source_spec: 1500x2000 layered
- export_spec: 750x1000 PNG
- runtime_du: 750x1000
- alpha: no
- pivot: 0,0
- nine_slice: none
- states: single
- visual_requirements: 复用result布局，新增纪录章，不伪造超过比例。 文字、头像、真实截图、二维码均运行时合成，四边留48px，底部入口留180px；平台实际尺寸另导出。
- color_space: sRGB
- status: deferred
- license_status: inherits_source_or_code
- filename: share_record_background.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#share_record_background

## share_daily_background · 每日同题分享卡

- category: share_template
- first_phase: P4-A
- required: required
- production_method: derived
- source_asset_id: share_result_background
- source_spec: 1500x2000 layered
- export_spec: 750x1000 PNG
- runtime_du: 750x1000
- alpha: no
- pivot: 0,0
- nine_slice: none
- states: single
- visual_requirements: 日期/题目/120投/标准2次/分数/截止时间动态排。 文字、头像、真实截图、二维码均运行时合成，四边留48px，底部入口留180px；平台实际尺寸另导出。
- color_space: sRGB
- status: deferred
- license_status: inherits_source_or_code
- filename: share_daily_background.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#share_daily_background

## share_friend_background · 好友挑战邀请卡

- category: share_template
- first_phase: P4-A
- required: required
- production_method: derived
- source_asset_id: share_result_background
- source_spec: 1500x2000 layered
- export_spec: 750x1000 PNG
- runtime_du: 750x1000
- alpha: no
- pivot: 0,0
- nine_slice: none
- states: single
- visual_requirements: 双方位、同题参数、有效期和challenge入口；待完成不可画成胜利。 文字、头像、真实截图、二维码均运行时合成，四边留48px，底部入口留180px；平台实际尺寸另导出。
- color_space: sRGB
- status: deferred
- license_status: inherits_source_or_code
- filename: share_friend_background.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#share_friend_background

## share_achievement_background · 图鉴成就分享卡

- category: share_template
- first_phase: P4-B
- required: required
- production_method: derived
- source_asset_id: share_result_background
- source_spec: 1500x2000 layered
- export_spec: 750x1000 PNG
- runtime_du: 750x1000
- alpha: no
- pivot: 0,0
- nine_slice: none
- states: single
- visual_requirements: 引用已发现小料或通用成就章，真实拥有才生成。 文字、头像、真实截图、二维码均运行时合成，四边留48px，底部入口留180px；平台实际尺寸另导出。
- color_space: sRGB
- status: deferred
- license_status: inherits_source_or_code
- filename: share_achievement_background.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#share_achievement_background

## marketing_app_icon · 游戏图标

- category: marketing
- first_phase: P2
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 1024x1024 layered
- export_spec: 512x512 PNG
- runtime_du: not in game
- alpha: no
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 主视觉单杯+麻薯/珍珠，中心80%安全区，无动态分和小字；平台实需另导出。
- color_space: sRGB
- status: planned
- license_status: not_acquired
- filename: marketing_app_icon.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#marketing_app_icon

## marketing_launch · 启动插画

- category: marketing
- first_phase: P2
- required: required
- production_method: derived
- source_asset_id: bg_shop_base
- source_spec: 1500x2668 layered
- export_spec: 750x1334 PNG
- runtime_du: not in game
- alpha: no
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 复用主背景和字标组合，中间留加载文案；不烘进度条。
- color_space: sRGB
- status: planned
- license_status: inherits_source_or_code
- filename: marketing_launch.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#marketing_launch

## marketing_cover_square · 方形宣传封面

- category: marketing
- first_phase: P3-C
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 1600x1600 layered
- export_spec: 800x800 PNG
- runtime_du: not in game
- alpha: no
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 原创主视觉，描述真实合成玩法，无虚假排名/现金奖励。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: marketing_cover_square.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#marketing_cover_square

## marketing_cover_landscape · 横版宣传封面

- category: marketing
- first_phase: P3-C
- required: required
- production_method: new_draw
- source_asset_id: 
- source_spec: 1920x1080 layered
- export_spec: 1280x720 PNG
- runtime_du: not in game
- alpha: no
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 主体与标题安全区居中，兼顾裁切。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: marketing_cover_landscape.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: static_pass
- available_exports: 1
- library_index: assets/library/index.html#marketing_cover_landscape

## marketing_screenshot_play · 上架玩法截图模板

- category: marketing
- first_phase: P3-C
- required: required
- production_method: derived
- source_asset_id: 
- source_spec: 1500x2668 layered
- export_spec: 750x1334 PNG
- runtime_du: not in game
- alpha: no
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 实际游戏截图为底，文本外置，不能用概念图伪装实机。
- color_space: sRGB
- status: deferred
- license_status: inherits_source_or_code
- filename: marketing_screenshot_play.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#marketing_screenshot_play

## marketing_screenshot_merge · 上架合成截图模板

- category: marketing
- first_phase: P3-C
- required: required
- production_method: derived
- source_asset_id: 
- source_spec: 1500x2668 layered
- export_spec: 750x1334 PNG
- runtime_du: not in game
- alpha: no
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 实际合成时刻截图，不添加不存在配料或3D操作。
- color_space: sRGB
- status: deferred
- license_status: inherits_source_or_code
- filename: marketing_screenshot_merge.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#marketing_screenshot_merge

## marketing_screenshot_stages · 上架五杯截图模板

- category: marketing
- first_phase: P3-C
- required: required
- production_method: derived
- source_asset_id: 
- source_spec: 1500x2668 layered
- export_spec: 750x1334 PNG
- runtime_du: not in game
- alpha: no
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 仅已实现五杯，锁/解锁与实际一致。
- color_space: sRGB
- status: deferred
- license_status: inherits_source_or_code
- filename: marketing_screenshot_stages.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#marketing_screenshot_stages

## marketing_screenshot_rank · 上架榜单截图模板

- category: marketing
- first_phase: P3-C
- required: required
- production_method: derived
- source_asset_id: 
- source_spec: 1500x2668 layered
- export_spec: 750x1334 PNG
- runtime_du: not in game
- alpha: no
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 使用匿名/获授权数据；若示意明确标，不能造真实活跃人数。
- color_space: sRGB
- status: deferred
- license_status: inherits_source_or_code
- filename: marketing_screenshot_rank.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#marketing_screenshot_rank

## marketing_tap_cover · Tap平台封面适配

- category: marketing
- first_phase: P4-D
- required: required
- production_method: derived
- source_asset_id: marketing_cover_landscape
- source_spec: reuse promotional master
- export_spec: platform template
- runtime_du: not in game
- alpha: no
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 候选尺寸不是官方保证，上架时按后台要求裁切，不能直接拉伸。
- color_space: sRGB
- status: deferred
- license_status: inherits_source_or_code
- filename: marketing_tap_cover.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#marketing_tap_cover

## marketing_wechat_icon · 微信平台图标适配

- category: marketing
- first_phase: P4-D
- required: required
- production_method: derived
- source_asset_id: marketing_app_icon
- source_spec: reuse app_icon
- export_spec: platform template
- runtime_du: not in game
- alpha: no
- pivot: 0.5,0.5
- nine_slice: none
- states: single
- visual_requirements: 保留原创母版，按后台当前规范导出。
- color_space: sRGB
- status: deferred
- license_status: inherits_source_or_code
- filename: marketing_wechat_icon.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: conditional_static
- available_exports: 1
- library_index: assets/library/index.html#marketing_wechat_icon

## candidate_cup_pattern · 未来杯身纹样槽

- category: future_candidate
- first_phase: P4-B
- required: candidate
- production_method: new_draw
- source_asset_id: 
- source_spec: TBD after approved content brief
- export_spec: TBD
- runtime_du: TBD
- alpha: yes
- pivot: TBD
- nine_slice: none
- states: single
- visual_requirements: 仅预留资产类型，不代表已确认数量/奖励/付费方式；立项后按具体ID扩充清单。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: candidate_cup_pattern.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: candidate_not_required
- available_exports: 0
- library_index: assets/library/index.html#candidate_cup_pattern

## candidate_table_theme · 未来桌面主题槽

- category: future_candidate
- first_phase: P4-B
- required: candidate
- production_method: new_draw
- source_asset_id: 
- source_spec: TBD after approved content brief
- export_spec: TBD
- runtime_du: TBD
- alpha: yes
- pivot: TBD
- nine_slice: none
- states: single
- visual_requirements: 仅预留资产类型，不代表已确认数量/奖励/付费方式；立项后按具体ID扩充清单。
- color_space: sRGB
- status: deferred
- license_status: not_acquired
- filename: candidate_table_theme.png
- acceptance: 检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志
- intake_status: candidate_not_required
- available_exports: 0
- library_index: assets/library/index.html#candidate_table_theme

