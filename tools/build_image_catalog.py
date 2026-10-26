"""Build the individual image inventory, not final game artwork. Standard library only."""
from pathlib import Path
import csv, html, json
ROOT = Path(__file__).resolve().parents[1]
ROWS = []
LABELS = dict(category='类别',first_phase='最早使用阶段',required='制作范围',production_method='制作方式',source_asset_id='复用来源ID',source_spec='源文件规格',export_spec='运行导出规格',runtime_du='游戏显示尺寸DU',alpha='透明背景',pivot='锚点',nine_slice='九切边距',states='状态',visual_requirements='视觉与制作要求',color_space='色彩空间',status='制作状态',license_status='授权状态',filename='交付文件名',acceptance='验收要求')
def add(asset_id, name, category, phase, method, source, export, runtime, alpha, pivot, notes, source_id="", required="required", states="single", slice_="none"):
    ROWS.append(dict(asset_id=asset_id, name_zh=name, category=category, first_phase=phase,
        required=required, production_method=method, source_asset_id=source_id, source_spec=source,
        export_spec=export, runtime_du=runtime, alpha=alpha, pivot=pivot, nine_slice=slice_,
        states=states, visual_requirements=notes, color_space="sRGB", status="planned" if phase in ["P1","P2"] else "deferred",
        license_status="not_acquired" if method=="new_draw" else "inherits_source_or_code",
        filename=asset_id+".png" if method in ["new_draw","derived"] else "(runtime)",
        acceptance="检查实际显示尺寸、透明边、光向、对比；不得含动态文本/平台伪造标志"))

def build():
    cfg=json.loads((ROOT/"config/design-baseline.json").read_text(encoding="utf-8"))
    looks=[
        ("半透明浅白珠团，三颗细亮点，浅灰边","#E6E1D5"),
        ("酒红豆团，可见豆纹，不能画成普通棕球","#9E4453"),
        ("黑糖棕单珠，单个白高光","#5A3428"),
        ("乳白圆角团，内部椰果方形纹，外廓近圆","#EFE7CE"),
        ("深棕大珍珠，双层高光，与小珍珠分别绘制","#37251F"),
        ("近黑绿仙草胶冻，透亮边缘和弯月亮面","#354438"),
        ("淡黄布丁，焦糖顶部，宽圆无细脚","#EAC36E"),
        ("淡紫绵密芋泥球，旋纹哑光","#AA87BE"),
        ("奶白软麻薯，粉感与居中压痕，最高级独特","#F3E8DA")]
    for item,(look,color) in zip(cfg["ingredients"],looks):
        aid="spr_ing_"+item["id"]+"_base"
        r=item["radius_du"]
        add(aid,item["name"],"ingredient","P1","new_draw","1024x1024 layered","128x128;256x256;512x512 PNG","visible diameter "+str(2*r),"yes","0.5,0.5",
            look+"；主色参考"+color+"；左上45度柔光；主体中心(512,512)，基准主体半径460.8px，外廓与碰撞偏差≤8%；无大外投影；层分base/texture/highlight/optional_face。")
        add("ui_ing_"+item["id"]+"_thumb",item["name"]+"缩略图","ingredient_thumbnail","P1","derived","reuse "+aid,"96x96 PNG","48x48","yes","0.5,0.5","从母版缩小后人工检查，必要时简化细纹；不改变材质和轮廓。",aid)
        add("ui_ing_"+item["id"]+"_locked",item["name"]+"图鉴未发现剪影","collection","P4-B","derived","reuse "+aid,"192x192 PNG","96x96","yes","0.5,0.5","原图alpha生成统一中性轮廓；问号为动态文字，不新增真实小料等级。",aid)
        add("ui_ing_"+item["id"]+"_detail",item["name"]+"图鉴详情图","collection","P4-B","derived","reuse "+aid,"512x512 PNG","256x256","yes","0.5,0.5","直接使用母版导出，不重复绘制；详情名称/等级由程序排版。",aid)
    for name,desc in [("neutral","中性眼嘴"),("happy","短时微笑"),("surprised","危险时惊讶")]:
        add("spr_face_"+name,"通用"+desc,"optional_face","P1","new_draw","256x128 SVG/layered","256x128 PNG","relative to ingredient","yes","0.5,0.5",
            "独立眼嘴覆盖层，单色深棕，透明背景；锚点相同，不遮配料主要纹理；静态三表情切换即可，无需逐帧。",required="optional")
    cups=[("classic","经典奶茶","P1","#D8B58A"),("coconut_green","椰香绿茶","P3-A","#BED2B3"),
        ("taro_boba","芋泥波波","P3-A","#B99ACA"),("brown_sugar","黑糖厚乳","P3-A","#B3835D"),
        ("mochi_special","麻薯特调","P3-A","#E6D1C8")]
    layers=[("back","杯后壁","半透明后缘，保留杯内内容可读。"),("tea","杯内奶茶底色","静态装饰底色，不画会误导物理的流动漩涡，不遮盖配料。"),
        ("front","杯前壁高光","前景alpha高光占杯面积约≤10%，禁止整杯深色透明遮罩。"),
        ("rim_back","杯口后缘","轻椭圆后半缘，仅表现厚度，不能暗示顶部有盖。"),
        ("rim_front","杯口前缘","前半缘薄高光，不遮危险线/落点。"),
        ("base","杯底装饰","视觉贴合y260物理杯底，无可支撑的假凸台。"),
        ("label","杯身无文字印花","原创抽象图形，动态款名另排文字，不用真实奶茶品牌。")]
    for sid,title,phase,color in cups:
        for suffix,lname,notes in layers:
            add("spr_cup_"+sid+"_"+suffix,title+lname,"cup_layer",phase,"new_draw","1500x2000 layered; registered world origin (0,200)","750x1000 PNG","750x1000","yes","0,0",
                notes+" 主调"+color+"；画布对应世界x0..750/y200..1200；杯内缘使用该款CupGeometry导出导线，顶y1060/底y260；所有层同画布禁止各自裁切或缩放。")
        add("ui_stage_"+sid+"_card",title+"菜单封面","stage_select","P3-A","derived","reuse cup layers","480x600 PNG","240x300","yes","0.5,0.5",
            "从该款杯图层合成，留30%区域给动态款名/纪录/解锁信息；不烘分数或锁。","spr_cup_"+sid+"_back")
    for aid,name,src,exp,run,note in [
        ("bg_shop_base","奶茶店低对比背景","1500x2668 layered","750x1334 PNG","750x1334","低细节桌面和简化店内形状，中心杯区留空，四边可延展，无品牌。"),
        ("bg_shop_extend_top","长屏顶部延展","1500x800 layered","750x400 PNG","750x400 tile-y","上下可衔接主背景，低对比，不能出现透视接缝。"),
        ("bg_shop_extend_bottom","长屏底部延展","1500x800 layered","750x400 PNG","750x400 tile-y","承接桌面，不放必需按钮或文字。"),
        ("ui_title_logo","奶茶挤挤原创标题字标","1600x600 layered/vector","800x300 PNG","400x150","标题允许艺术字；先确认字形授权，不抄品牌Logo。"),
        ("spr_cup_shadow","杯底接触阴影","1024x256 layered","512x128 PNG","520x100","柔边低alpha，独立于小料，不造成大透明叠层。")]:
        add(aid,name,"environment","P1","new_draw",src,exp,run,"yes" if "bg_" not in aid else "no","0.5,0.5",note)
    skins=[
        ("primary","主按钮","#8B4E2F","360x104","32,32,32,32"),
        ("secondary","次按钮","#F1E2CF","300x96","28,28,28,28"),
        ("icon","圆图标按钮","#F1E2CF","96x96","24,24,24,24"),
        ("tab","选项页签","#F1E2CF","180x80","20,20,20,20")]
    for kind,title,color,run,slices in skins:
        for state in ["normal","pressed","disabled","selected"]:
            aid="ui_btn_"+kind+"_"+state
            add(aid,title+" "+state,"button_skin","P1" if kind!="tab" else "P3-A","new_draw" if state=="normal" else "derived",
                "512x192 vector/layered" if kind not in ["icon"] else "192x192 vector",
                "256x96 PNG" if kind!="icon" else "96x96 PNG",run,"yes","0.5,0.5",
                "主色"+color+"；不含文案/图标。"+{"normal":"柔和圆角边，按钮边界清楚。","pressed":"从normal降低亮度并加内阴影，缩放由程序做。","disabled":"降低饱和度但仍可读，程序同时禁用点击。","selected":"加实线/勾选线索，不仅改颜色。"}[state],
                "" if state=="normal" else "ui_btn_"+kind+"_normal",slice_=slices)
    icons=[
        ("play","开始三角","P1"),("continue","继续箭头","P1"),("pause","暂停双条","P1"),("settings","设置齿轮","P1"),
        ("close","关闭叉","P1"),("back","返回箭头","P1"),("restart","重开回转箭头","P1"),("home","主页小屋","P1"),
        ("music_on","音乐开","P1"),("music_off","音乐关","P1"),("sfx_on","音效开","P1"),("sfx_off","音效关","P1"),
        ("reduced_motion","弱动态","P1"),("shake","晃杯动作","P1"),("info","说明","P1"),("warning","危险提示","P1"),
        ("check","确认勾","P1"),("next","下一个箭头","P1"),("record","录屏","P2"),("publish","发布作品","P2"),
        ("sidebar","侧边栏复访提示","P2"),("lock","未解锁锁","P3-A"),("unlock","解锁锁","P3-A"),
        ("cloud","云存档","P3-A"),("sync","同步","P3-A"),("offline","离线","P3-A"),("account","账号默认","P3-A"),
        ("coupon","晃杯券","P3-B"),("rank","排行榜","P3-B"),("share","分享","P3-B"),("standard","标准局标识","P3-B"),
        ("assisted","助力局标识","P3-B"),("verified","核验通过","P3-B"),("pending","核验中","P3-B"),
        ("calendar","每日挑战","P4-A"),("friend","好友挑战","P4-A"),("win","领先标识","P4-A"),
        ("tie","平局标识","P4-A"),("loss","落后标识","P4-A"),("album","图鉴","P4-B"),
        ("achievement","成就","P4-B"),("skin","外观","P4-B"),("ad_play","自愿看视频","P4-C"),
        ("external","外链提示","P4-D")]
    for key,title,phase in icons:
        add("ui_icon_"+key,title,"icon",phase,"new_draw","192x192 SVG","96x96 PNG;48x48 PNG","48x48","yes","0.5,0.5",
            "笔画在96px图至少4px；深棕主色，统一圆角；实际触摸框≥48 CSSpx；"+("使用原创提示图，不伪造平台官方Logo或认证。" if key in ["sidebar","verified"] else "关闭/禁用变色由程序生成，不重复绘制。"))
    panels=[
        ("modal","通用弹窗底","P1","640x720","320x360 PNG","32,32,32,32"),
        ("hud","HUD底","P1","680x120","340x60 PNG","20,20,20,20"),
        ("next","下一份预告框","P1","140x140","140x140 PNG","24,24,24,24"),
        ("toast","短提示底","P1","500x80","250x40 PNG","16,16,16,16"),
        ("results","结算面板","P1","660x820","330x410 PNG","36,36,36,36"),
        ("stage","关卡卡片底","P3-A","280x400","280x400 PNG","24,24,24,24"),
        ("rank_row","排行行底","P3-B","660x96","330x48 PNG","12,12,12,12"),
        ("rank_self","本人排行行高亮","P3-B","660x96","330x48 PNG","12,12,12,12"),
        ("challenge","挑战卡底","P4-A","660x400","330x200 PNG","24,24,24,24"),
        ("collection","图鉴格底","P4-B","180x210","180x210 PNG","16,16,16,16")]
    for key,title,phase,run,exp,slices in panels:
        add("ui_panel_"+key,title,"panel",phase,"new_draw","2x export layered/vector",exp,run,"yes","0.5,0.5",
            "圆角奶油纸感，低频纹理；内部留白24DU以上，标题/数值/头像全部由程序填。",slice_=slices)
    for key,title,phase,exp,run,note in [
        ("toggle_track","开关轨道","P1","128x64 PNG","96x48","开关开/关用程序颜色与圆钮位置，不仅用颜色说明。"),
        ("toggle_knob","开关圆钮","P1","64x64 PNG","40x40","边缘清楚，移动由程序控制。"),
        ("slider_track","音量滑杆轨道","P1","256x24 PNG","260x12","平直，两端圆角，可横向九切。"),
        ("slider_knob","音量滑杆圆钮","P1","64x64 PNG","44x44","触摸框另放大，不改变视觉半径。"),
        ("badge_record","新纪录徽章","P1","256x128 PNG","128x64","不含“新纪录”文字，图形为原创星章。"),
        ("badge_mochi","首次麻薯徽章","P1","192x192 PNG","96x96","仅里程碑装饰，不暗示游戏胜利结束。"),
        ("avatar_default","默认玩家头像","P3-B","256x256 PNG","80x80","原创奶茶图案，圆形安全区90%，不得使用真人肖像。"),
        ("medal_gold","排行第一奖牌","P3-B","128x128 PNG","64x64","金色与独特轮廓，数字动态排。"),
        ("medal_silver","排行第二奖牌","P3-B","128x128 PNG","64x64","银色。"),
        ("medal_bronze","排行第三奖牌","P3-B","128x128 PNG","64x64","铜色，平分按rank显示。"),
        ("coupon_ticket","晃杯券票面","P3-B","480x240 PNG","240x120","虚线票口；不画固定余额/倒计时/5次承诺。"),
        ("badge_discovered","图鉴已发现角标","P4-B","96x96 PNG","48x48","用勾/星轮廓区分，不仅改色。"),
        ("badge_achievement","通用成就章","P4-B","192x192 PNG","96x96","动态成就名称另排。")]:
        add("ui_"+key,title,"ui_detail",phase,"new_draw","2x export layered/vector",exp,run,"yes","0.5,0.5",note)
    for key,title,note in [
        ("merge_ring","合成柔光环","透明中心、软边奶白环，扩散和透明度程序动画。"),
        ("sparkle","短星光","四角柔光星，尺寸小，不画大面积纯白。"),
        ("crumb","食材细屑","圆润单粒，可程序着色；不能误认成可合成实体。"),
        ("drop_ping","投放确认光点","短弧/点形，中心透明，不遮下落轮廓。"),
        ("mochi_star","麻薯里程碑星","圆润星形，≤900ms局部特效，不盖杯口。"),
        ("unlock_glow","解锁卡片亮边","圆角卡边软光，中心透明，P3再用。")]:
        add("fx_"+key,title,"effect","P3-A" if key=="unlock_glow" else "P1","new_draw","512x512 layered","256x256 PNG","16..320 by effect","yes","0.5,0.5",
            note+" 同时粒子初始预算48，弱动态减量；不制作逐帧大图集，程序驱动尺寸/alpha。")
    for key,title,note in [
        ("hand_move","引导手指移动","单手指和横向运动箭头分层，适配左右拖动。"),
        ("hand_release","引导松手","手指与小料间留空，表达松开而非猛点。"),
        ("merge_example","两同级合成示例","只画布局背景，三个小料引用已有缩略图与动态箭头。")]:
        add("ui_tutorial_"+key,title,"tutorial","P1","new_draw" if key!="merge_example" else "engine",
            "512x512 vector/layered","256x256 PNG" if key!="merge_example" else "none","256x256","yes","0.5,0.5",note)
    for key,title,phase,note in [
        ("danger_line","警戒线","P1","y=1000世界高度，虚线/倒计时程序绘制，平时淡，危险≤2Hz呼吸。"),
        ("drop_guide","落点虚线","P1","从预览到杯内可落点，随x更新，不是实体/不改变物理。"),
        ("score_text","当前分/飘分/纪录","P1","动态字体，整数，弱动态可关飘分；不能烘到图。"),
        ("danger_countdown","三秒倒计时","P1","根据180tick剩余生成数字，暂停不走。"),
        ("shake_count","晃杯剩余和冷却","P1","动态数字/进度，区别基础与券；0不做假的可点状态。"),
        ("modal_dim","弹窗遮罩","P1","引擎纯色矩形alpha，拦触摸；无须整屏PNG。"),
        ("loading_spinner","加载转圈","P1","程序绘线或复用sync图标旋转，弱动态静态文案。"),
        ("skeleton","异步列表骨架","P3-A","引擎圆角矩形，内容加载失败替换错误页。"),
        ("locked_overlay","未解锁卡遮罩","P3-A","程序灰度/透明底+lock，阈值动态显示。"),
        ("leaderboard_rank","榜单名次/超过比例","P3-B","动态rank文本，同分并列，不手绘固定数值。"),
        ("coupon_expiry","券余额/到期文本","P3-B","serverTime计算显示，北京24点到期。"),
        ("daily_budget","120投进度条","P4-A","动态0..120，不得显示无上限。"),
        ("challenge_status","挑战待定/领先/平局/落后","P4-A","图标复用win/tie/loss，文本由实际核验状态决定。"),
        ("album_question","未发现问号","P4-B","动态字形叠剪影；不画假隐藏第10级。"),
        ("error_empty","空/错/无网络状态组合","P3-A","复用info/offline/icon +动态文案+重试按钮，无额外插画必需。")]:
        add("gen_"+key,title,"engine_generated",phase,"engine","none","none","layout-dependent","yes","layout",note)
    for key,title,phase,note in [
        ("user_avatar","授权玩家头像","P3-B","仅实际授权URL，加载失败用ui_avatar_default；不预制真实人图。"),
        ("share_entry_code","真实游戏入口码","P3-B","平台真实生成并确认可用，无授权不绘制假的码。"),
        ("challenge_entry_code","真实挑战入口码","P4-A","服务端/平台按真实challengeId生成，不手绘假二维码。"),
        ("ad_badge","平台广告标识","P4-C","由SDK或官方许可规范提供，不自行模仿。"),
        ("platform_review_logo","发行平台规定标志","P4-D","仅平台当前要求且允许时使用，尺寸按实际模板再导出。")]:
        add("platform_"+key,title,"platform_provided",phase,"platform","provider-specified","provider-specified","provider-specified","provider","provider",note)
    for key,title,phase,note in [
        ("result","普通成绩分享卡","P3-B","保留杯截图、分数、最高小料、奶茶款、标准/助力和入口位。"),
        ("record","新纪录分享卡","P3-B","复用result布局，新增纪录章，不伪造超过比例。"),
        ("daily","每日同题分享卡","P4-A","日期/题目/120投/标准2次/分数/截止时间动态排。"),
        ("friend","好友挑战邀请卡","P4-A","双方位、同题参数、有效期和challenge入口；待完成不可画成胜利。"),
        ("achievement","图鉴成就分享卡","P4-B","引用已发现小料或通用成就章，真实拥有才生成。")]:
        add("share_"+key+"_background",title,"share_template",phase,"new_draw" if key=="result" else "derived",
            "1500x2000 layered","750x1000 PNG","750x1000","no","0,0",note+" 文字、头像、真实截图、二维码均运行时合成，四边留48px，底部入口留180px；平台实际尺寸另导出。",
            "" if key=="result" else "share_result_background")
    for key,title,phase,src,exp,note in [
        ("app_icon","游戏图标","P2","1024x1024 layered","512x512 PNG","主视觉单杯+麻薯/珍珠，中心80%安全区，无动态分和小字；平台实需另导出。"),
        ("launch","启动插画","P2","1500x2668 layered","750x1334 PNG","复用主背景和字标组合，中间留加载文案；不烘进度条。"),
        ("cover_square","方形宣传封面","P3-C","1600x1600 layered","800x800 PNG","原创主视觉，描述真实合成玩法，无虚假排名/现金奖励。"),
        ("cover_landscape","横版宣传封面","P3-C","1920x1080 layered","1280x720 PNG","主体与标题安全区居中，兼顾裁切。"),
        ("screenshot_play","上架玩法截图模板","P3-C","1500x2668 layered","750x1334 PNG","实际游戏截图为底，文本外置，不能用概念图伪装实机。"),
        ("screenshot_merge","上架合成截图模板","P3-C","1500x2668 layered","750x1334 PNG","实际合成时刻截图，不添加不存在配料或3D操作。"),
        ("screenshot_stages","上架五杯截图模板","P3-C","1500x2668 layered","750x1334 PNG","仅已实现五杯，锁/解锁与实际一致。"),
        ("screenshot_rank","上架榜单截图模板","P3-C","1500x2668 layered","750x1334 PNG","使用匿名/获授权数据；若示意明确标，不能造真实活跃人数。"),
        ("tap_cover","Tap平台封面适配","P4-D","reuse promotional master","platform template","候选尺寸不是官方保证，上架时按后台要求裁切，不能直接拉伸。"),
        ("wechat_icon","微信平台图标适配","P4-D","reuse app_icon","platform template","保留原创母版，按后台当前规范导出。")]:
        add("marketing_"+key,title,"marketing",phase,"new_draw" if key in ["app_icon","cover_square","cover_landscape"] else "derived",
            src,exp,"not in game","no","0.5,0.5",note,
            "marketing_app_icon" if key=="wechat_icon" else ("bg_shop_base" if key=="launch" else ("marketing_cover_landscape" if key=="tap_cover" else "")))
    # Content not approved is explicitly optional, never counted as a launch obligation.
    for key,title in [("cup_pattern","未来杯身纹样槽"),("table_theme","未来桌面主题槽")]:
        add("candidate_"+key,title,"future_candidate","P4-B","new_draw","TBD after approved content brief","TBD","TBD","yes","TBD",
            "仅预留资产类型，不代表已确认数量/奖励/付费方式；立项后按具体ID扩充清单。",required="candidate")

def write():
    build()
    payload={"version":"handoff-v0.2","date":"2026-10-27","scope":"Image inventory; no final artwork supplied",
        "method_definitions":{"new_draw":"需要设计母版","derived":"复用母版导出/合成，仍需检查","engine":"程序生成，不需独立手绘文件","platform":"合法平台/授权数据提供"},
        "assets":ROWS}
    assets=ROOT/"assets"
    (assets/"image-elements.json").write_text(json.dumps(payload,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    for filename in ["image-elements.csv","asset-manifest.csv"]:
        with (assets/filename).open("w",encoding="utf-8",newline="") as f:
            writer=csv.DictWriter(f,fieldnames=list(ROWS[0])); writer.writeheader();writer.writerows(ROWS)
    counts={}
    for row in ROWS: counts[row["production_method"]]=counts.get(row["production_method"],0)+1
    intro="# 图像逐项制作清单\n\n本清单由 tools/build_image_catalog.py 生成，修改生成源后重建；所有图片待制作。共"+str(len(ROWS))+"项，制作方式计数："+json.dumps(counts,ensure_ascii=False)+"。\n\n"+        "一项可能有多档尺寸，不能把导出档数当作新画数量。optional/candidate不属于必交；平台官方尺寸需实施时复核。\n\n"
    md=[intro]; cards=[]
    for row in ROWS:
        md.append("## "+row["asset_id"]+" · "+row["name_zh"]+"\n\n")
        md.append("\n".join("- "+k+": "+str(v) for k,v in row.items() if k not in ["asset_id","name_zh"])+"\n\n")
        values={'new_draw':'需要设计母版','derived':'从母版派生','engine':'程序绘制','platform':'平台提供','required':'本阶段必需','optional':'可选','candidate':'未来候选','planned':'待制作','deferred':'后续阶段待制作','not_acquired':'尚未取得授权','inherits_source_or_code':'沿用原资产或程序的授权','yes':'需要','no':'不需要','none':'不使用'}
        body="".join("<dt>"+html.escape(LABELS.get(k,k))+"</dt><dd>"+html.escape(values.get(str(v),str(v)))+"</dd>" for k,v in row.items() if k not in ["asset_id","name_zh"])
        cards.append('<article data-phase="'+row["first_phase"]+'" data-method="'+row["production_method"]+'"><h2>'+html.escape(row["name_zh"])+'</h2><code>'+row["asset_id"]+'</code><dl>'+body+'</dl></article>')
    (ROOT/"docs/art").mkdir(exist_ok=True)
    (ROOT/"docs/art/image-catalog.md").write_text("".join(md),encoding="utf-8")
    page='''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><title>奶茶挤挤 · 图像制作清单</title><style>
    *{box-sizing:border-box}body{margin:0;background:#fff7ec;color:#3d2a23;font:15px/1.7 "Microsoft YaHei",sans-serif}header{padding:32px max(20px,5vw);background:#eedfc9}h1{margin:0}label{display:inline-block;margin:12px 16px 0 0}input,select{padding:10px;border:1px solid #a8886c;border-radius:6px;max-width:100%}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,360px),1fr));gap:20px;padding:24px max(20px,5vw)}article{background:#fffdf8;border:1px solid #decab1;border-radius:12px;padding:20px;min-width:0}h2{font-size:19px;margin:0 0 4px}code{font:12px Consolas,monospace;overflow-wrap:anywhere}dl{margin:12px 0 0}dt{font-weight:bold;font-size:12px;color:#805130;margin-top:8px}dd{margin:0;overflow-wrap:anywhere}[hidden]{display:none!important}a{color:#784027}
    </style><header><h1>奶茶挤挤 · 图像制作清单</h1><p>COUNT项 · 所有最终图片待制作 · “派生”可复用，不需每项重画</p><p><a href="../docs/14-image-production.md">制作总规范</a> · <a href="image-elements.csv">CSV清单</a> · <a href="../docs/development/development-handbook.html">开发手册</a></p>
    <label>查找 <input id="search" placeholder="名称、ID、用途、要求"></label><label>阶段 <select id="phase"><option value="">全部</option>PHASES</select></label><label>方式 <select id="method"><option value="">全部</option><option>new_draw</option><option>derived</option><option>engine</option><option>platform</option></select></label><p id="count" aria-live="polite"></p></header><main>CARDS</main><script>
    const cards=[...document.querySelectorAll("article")], search=document.querySelector("#search"), phase=document.querySelector("#phase"), method=document.querySelector("#method");
    function filter(){let n=0;cards.forEach(c=>{const ok=(!phase.value||c.dataset.phase===phase.value)&&(!method.value||c.dataset.method===method.value)&&c.textContent.toLowerCase().includes(search.value.trim().toLowerCase());c.hidden=!ok;if(ok)n++;});document.querySelector("#count").textContent="显示 "+n+" / "+cards.length+" 项";}
    [search,phase,method].forEach(e=>e.addEventListener("input",filter));filter();
    </script></html>'''
    phases=sorted(set(x["first_phase"] for x in ROWS))
    page=page.replace("COUNT",str(len(ROWS))).replace("PHASES","".join("<option>"+p+"</option>" for p in phases)).replace("CARDS","".join(cards))
    (assets/"image-elements.html").write_text(page,encoding="utf-8")
    guides=ROOT/'docs/visuals/cup-guides';guides.mkdir(exist_ok=True)
    cfg=json.loads((ROOT/'config/design-baseline.json').read_text(encoding='utf-8'))
    for stage in cfg['stages']:
        scale=stage['cup_width_scale'];bl=375-180*scale;br=375+180*scale;tl=375-260*scale;tr=375+260*scale
        svg=f'''<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="2000" viewBox="0 0 750 1000"><rect width="750" height="1000" fill="#fffaf3"/><g fill="none" stroke="#8b4e2f" stroke-width="2"><path d="M{tl},140 L{bl},940 L{br},940 L{tr},140"/><path d="M0,200 H750" stroke="#b93838" stroke-dasharray="8 6"/><path d="M375,0 V1000" stroke="#baa896" stroke-dasharray="4 4"/></g><g font-family="sans-serif" font-size="18" fill="#3d2a23"><text x="24" y="32">{stage['id']} · width scale {scale}</text><text x="24" y="62">Art guide only / not final artwork</text><text x="24" y="96">Canvas world x=0..750, y=200..1200</text><text x="24" y="185">Danger world y=1000 / pixel y=200</text><text x="24" y="980">Bottom y=260 / pixel y=940; top y=1060 / pixel y=140</text></g><circle cx="375" cy="800" r="140" fill="none" stroke="#aa87be" stroke-dasharray="6 6"/></svg>'''
        (guides/(stage['id']+'.svg')).write_text(svg,encoding='utf-8')
    print(json.dumps({"image_items":len(ROWS),"production_methods":counts},ensure_ascii=False))
if __name__=="__main__":write()

