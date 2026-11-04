System.register("chunks:///_virtual/AppRoot.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './ConfigLoader.ts', './HostLifecycleCoordinator.ts', './CoordinateMapper.ts', './Viewport.ts', './GameRoot.ts', './AppRuntime.ts'], function (exports) {
  var _inheritsLoose, cclegacy, _decorator, Canvas, UITransform, input, Input, resources, JsonAsset, Node, Graphics, Color, Label, Texture2D, SpriteFrame, Sprite, PHYSICS_2D_PTM_RATIO, PhysicsSystem2D, Vec2, director, Vec3, Component, ConfigLoader, HostLifecycleCoordinator, CoordinateMapper, configureViewport, presentationSize, GameRoot, AppRuntime;
  return {
    setters: [function (module) {
      _inheritsLoose = module.inheritsLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
      _decorator = module._decorator;
      Canvas = module.Canvas;
      UITransform = module.UITransform;
      input = module.input;
      Input = module.Input;
      resources = module.resources;
      JsonAsset = module.JsonAsset;
      Node = module.Node;
      Graphics = module.Graphics;
      Color = module.Color;
      Label = module.Label;
      Texture2D = module.Texture2D;
      SpriteFrame = module.SpriteFrame;
      Sprite = module.Sprite;
      PHYSICS_2D_PTM_RATIO = module.PHYSICS_2D_PTM_RATIO;
      PhysicsSystem2D = module.PhysicsSystem2D;
      Vec2 = module.Vec2;
      director = module.director;
      Vec3 = module.Vec3;
      Component = module.Component;
    }, function (module) {
      ConfigLoader = module.ConfigLoader;
    }, function (module) {
      HostLifecycleCoordinator = module.HostLifecycleCoordinator;
    }, function (module) {
      CoordinateMapper = module.CoordinateMapper;
    }, function (module) {
      configureViewport = module.configureViewport;
      presentationSize = module.presentationSize;
    }, function (module) {
      GameRoot = module.GameRoot;
    }, function (module) {
      AppRuntime = module.AppRuntime;
      exports('AppRuntime', module.AppRuntime);
    }],
    execute: function () {
      var _dec, _class;
      cclegacy._RF.push({}, "23a90TkkpxQSKONswVIHcNR", "AppRoot", undefined);
      var ccclass = _decorator.ccclass;
      var AppRoot = exports('AppRoot', (_dec = ccclass('AppRoot'), _dec(_class = /*#__PURE__*/function (_Component) {
        _inheritsLoose(AppRoot, _Component);
        function AppRoot() {
          var _this;
          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }
          _this = _Component.call.apply(_Component, [this].concat(args)) || this;
          _this.retryNode = null;
          _this.loadGeneration = 0;
          _this.loading = false;
          _this.startupToken = 0;
          _this.startupFrame = null;
          _this.sceneTransition = false;
          return _this;
        }
        var _proto = AppRoot.prototype;
        _proto.onLoad = function onLoad() {
          var _this$node$getCompone;
          if (!this.node.getComponent(Canvas)) this.node.addComponent(Canvas);
          var transform = (_this$node$getCompone = this.node.getComponent(UITransform)) != null ? _this$node$getCompone : this.node.addComponent(UITransform);
          transform.setContentSize(750, 1334);
          // The error screen must have a camera and usable coordinate space even when configuration cannot load.
          configureViewport(this.node, {
            width_du: 750,
            height_du: 1334
          });
          HostLifecycleCoordinator.install();
          this.showBrandFrame();
          globalThis.__p1aLifecycle = {
            snapshot: function snapshot() {
              return HostLifecycleCoordinator.snapshot();
            },
            verifyResumeTransitions: function verifyResumeTransitions() {
              return HostLifecycleCoordinator.verifyResumeTransitionsForTests();
            }
          };
          input.on(Input.EventType.TOUCH_END, this.onRetryTouch, this);
          this.loadConfiguration();
        };
        _proto.onDestroy = function onDestroy() {
          this.loadGeneration++;
          input.off(Input.EventType.TOUCH_END, this.onRetryTouch, this);
          if (this.loading && !this.sceneTransition) resources.release('config/design-baseline', JsonAsset);
          if (!this.sceneTransition && this.startupToken !== 0 && AppRuntime.startupToken === this.startupToken) {
            AppRuntime.startupInProgress = false;
            AppRuntime.startupToken = 0;
          }
        };
        _proto.retry = function retry() {
          this.loadConfiguration();
        };
        _proto.showBrandFrame = function showBrandFrame() {
          var _this2 = this;
          var root = this.startupFrame = new Node('MilkTeaStartupFrame');
          this.node.addChild(root);
          root.setSiblingIndex(0);
          var transform = root.addComponent(UITransform);
          transform.setContentSize(750, 1334);
          var size = presentationSize(),
            background = root.addComponent(Graphics);
          background.fillColor = new Color(255, 244, 225);
          background.rect(-size.width / 2, -size.height / 2, size.width, size.height);
          background.fill();
          var labelNode = new Node('BrandFallback');
          root.addChild(labelNode);
          labelNode.addComponent(UITransform).setContentSize(650, 150);
          labelNode.setPosition(0, 190, 0);
          var label = labelNode.addComponent(Label);
          label.string = '奶茶挤挤';
          label.fontSize = 82;
          label.lineHeight = 94;
          label.isBold = true;
          label.color = new Color(103, 58, 32);
          resources.load('startup/brand-logo/texture', Texture2D, function (error, texture) {
            if (!_this2.isValid || _this2.startupFrame !== root || !root.isValid || !root.activeInHierarchy) return;
            if (error || !texture) {
              var _error$message;
              console.warn("Startup logo unavailable; using text fallback: " + ((_error$message = error == null ? void 0 : error.message) != null ? _error$message : 'missing asset'));
              return;
            }
            var frame = new SpriteFrame();
            frame.texture = texture;
            frame.packable = false;
            root.once(Node.EventType.NODE_DESTROYED, function () {
              if (frame.isValid) frame.destroy();
            });
            var logoNode = new Node('BrandLogo');
            root.addChild(logoNode);
            logoNode.addComponent(UITransform).setContentSize(620, 218);
            logoNode.setPosition(0, 190, 0);
            var sprite = logoNode.addComponent(Sprite);
            sprite.spriteFrame = frame;
            labelNode.active = false;
          });
          var taglineNode = new Node('BrandTagline');
          root.addChild(taglineNode);
          taglineNode.addComponent(UITransform).setContentSize(690, 80);
          taglineNode.setPosition(0, 20, 0);
          var tagline = taglineNode.addComponent(Label);
          tagline.string = '接住小料，挤出好心情';
          tagline.fontSize = 30;
          tagline.lineHeight = 40;
          tagline.color = new Color(103, 58, 32);
          var phaseNode = new Node('BrandPhase');
          root.addChild(phaseNode);
          phaseNode.addComponent(UITransform).setContentSize(690, 70);
          phaseNode.setPosition(0, -360, 0);
          var phase = phaseNode.addComponent(Label);
          phase.string = '准备杯子';
          phase.fontSize = 24;
          phase.lineHeight = 32;
          phase.color = new Color(145, 92, 57);
        };
        _proto.onRetryTouch = function onRetryTouch() {
          var _this$retryNode;
          if ((_this$retryNode = this.retryNode) != null && _this$retryNode.isValid) this.retry();
        };
        _proto.loadConfiguration = function loadConfiguration() {
          var _this3 = this;
          if (this.loading || AppRuntime.startupInProgress) return;
          this.loading = true;
          AppRuntime.startupInProgress = true;
          this.startupToken = ++AppRuntime.startupSequence;
          AppRuntime.startupToken = this.startupToken;
          AppRuntime.rules = null;
          AppRuntime.mapper = null;
          AppRuntime.loadError = null;
          var generation = ++this.loadGeneration;
          resources.load('config/design-baseline', JsonAsset, function (error, asset) {
            var _this3$retryNode, _location$search, _location;
            if (generation !== _this3.loadGeneration || !_this3.isValid || AppRuntime.startupToken !== _this3.startupToken) return;
            if (error || !asset) {
              var _error$message2;
              resources.release('config/design-baseline', JsonAsset);
              _this3.finishStartup(_this3.startupToken);
              _this3.showError("\u914D\u7F6E\u8BFB\u53D6\u5931\u8D25\uFF1A" + ((_error$message2 = error == null ? void 0 : error.message) != null ? _error$message2 : '资源缺失'));
              return;
            }
            var result = ConfigLoader.validate(asset.json);
            if (!result.ok) {
              // A retry must not reuse the invalid JsonAsset cached by the resource bundle.
              resources.release('config/design-baseline', JsonAsset);
              _this3.finishStartup(_this3.startupToken);
              _this3.showError("\u914D\u7F6E\u6821\u9A8C\u5931\u8D25\uFF1A" + result.error.message);
              return;
            }
            configureViewport(_this3.node, result.data.viewport);
            AppRuntime.rules = result.data;
            (_this3$retryNode = _this3.retryNode) == null || _this3$retryNode.destroy();
            _this3.retryNode = null;
            var mapper = AppRuntime.mapper = new CoordinateMapper(result.data.viewport.width_du, result.data.viewport.height_du, result.data.viewport.du_per_spec_physics_unit, PHYSICS_2D_PTM_RATIO);
            var physics = PhysicsSystem2D.instance;
            physics.autoSimulation = false;
            physics.fixedTimeStep = 1 / result.data.physics.fixed_hz;
            physics.resetAccumulator(0);
            physics.allowSleep = result.data.physics.sleep;
            physics.velocityIterations = result.data.physics.velocity_iterations;
            physics.positionIterations = result.data.physics.position_iterations;
            if (!(PhysicsSystem2D.PHYSICS_BOX2D || PhysicsSystem2D.PHYSICS_BOX2D_WASM)) {
              _this3.finishStartup(_this3.startupToken);
              _this3.showError('未启用2D Box2D：请在项目设置→功能裁剪中启用后重试');
              return;
            }
            physics.gravity = new Vec2(mapper.specAccelerationToCocosGravityApi(result.data.physics.gravity.x), mapper.specAccelerationToCocosGravityApi(result.data.physics.gravity.y));
            var token = _this3.startupToken;
            var diagnosticLab = new URLSearchParams((_location$search = (_location = globalThis.location) == null ? void 0 : _location.search) != null ? _location$search : '').get('p1aLab') === '1';
            if (diagnosticLab) {
              _this3.sceneTransition = true;
              var accepted = director.loadScene('PhysicsLab', function (loadError) {
                if (AppRuntime.startupToken !== token) return;
                AppRuntime.startupInProgress = false;
                AppRuntime.startupToken = 0;
                if (loadError && _this3.isValid) {
                  _this3.sceneTransition = false;
                  _this3.loading = false;
                  AppRuntime.rules = null;
                  AppRuntime.mapper = null;
                  _this3.showError("\u8BCA\u65AD\u573A\u666F\u5207\u6362\u5931\u8D25\uFF1A" + loadError.message);
                }
              });
              if (!accepted && AppRuntime.startupToken === token) {
                _this3.sceneTransition = false;
                AppRuntime.rules = null;
                AppRuntime.mapper = null;
                _this3.finishStartup(token);
                _this3.showError('诊断场景切换未启动：未找到PhysicsLab场景');
              }
            } else {
              try {
                _this3.node.addComponent(GameRoot);
                _this3.finishStartup(token);
              } catch (error) {
                _this3.finishStartup(token);
                _this3.showError("\u73A9\u5BB6\u754C\u9762\u521D\u59CB\u5316\u5931\u8D25\uFF1A" + String(error));
              }
            }
          });
        };
        _proto.showError = function showError(message) {
          var _this$retryNode2;
          AppRuntime.loadError = message;
          if ((_this$retryNode2 = this.retryNode) != null && _this$retryNode2.isValid) this.retryNode.destroy();
          var root = this.retryNode = new Node('ConfigErrorRetry');
          this.node.addChild(root);
          var ui = root.addComponent(UITransform);
          ui.setContentSize(700, 220);
          var label = root.addComponent(Label);
          label.string = '配置加载或校验失败\n点击画面重试';
          label.fontSize = 28;
          label.lineHeight = 40;
          label.overflow = Label.Overflow.CLAMP;
          label.enableWrapText = true;
          console.error(message);
          root.setPosition(new Vec3(0, 0, 0));
        };
        _proto.finishStartup = function finishStartup(token) {
          if (AppRuntime.startupToken !== token) return;
          this.loading = false;
          AppRuntime.startupInProgress = false;
          AppRuntime.startupToken = 0;
          this.startupToken = 0;
          var ready = globalThis.__milkteaBootReady;
          if (typeof ready === 'function') ready();
        };
        return AppRoot;
      }(Component)) || _class));
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/AppRuntime.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './HostLifecycleCoordinator.ts'], function (exports) {
  var _createClass, cclegacy, HostLifecycleCoordinator;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      HostLifecycleCoordinator = module.HostLifecycleCoordinator;
    }],
    execute: function () {
      cclegacy._RF.push({}, "5a531a36ApMboinRwonp+lu", "AppRuntime", undefined);
      /** Runtime state shared by boot, diagnostics scenes, and the player scene. */
      var AppRuntime = exports('AppRuntime', /*#__PURE__*/function () {
        function AppRuntime() {}
        _createClass(AppRuntime, null, [{
          key: "backgrounded",
          get: function get() {
            return HostLifecycleCoordinator.backgrounded;
          }
        }]);
        return AppRuntime;
      }());
      AppRuntime.buildId = '20261104-spill-revive-debug-03';
      AppRuntime.configRulesHash = 'c4c93c79d0b1d1bfd0eb65ade281e3f7ef29ea95124c54a60bdcafde5d716d02';
      AppRuntime.rules = null;
      AppRuntime.mapper = null;
      AppRuntime.loadError = null;
      AppRuntime.startupInProgress = false;
      AppRuntime.startupToken = 0;
      AppRuntime.startupSequence = 0;
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/ArtAssets.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './ArtCatalog.ts'], function (exports) {
  var _createForOfIteratorHelperLoose, _createClass, _asyncToGenerator, _regeneratorRuntime, cclegacy, Sprite, Node, UITransform, Texture2D, SpriteFrame, assetManager, resources, ImageAsset, JsonAsset, ArtCatalog;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
      _createClass = module.createClass;
      _asyncToGenerator = module.asyncToGenerator;
      _regeneratorRuntime = module.regeneratorRuntime;
    }, function (module) {
      cclegacy = module.cclegacy;
      Sprite = module.Sprite;
      Node = module.Node;
      UITransform = module.UITransform;
      Texture2D = module.Texture2D;
      SpriteFrame = module.SpriteFrame;
      assetManager = module.assetManager;
      resources = module.resources;
      ImageAsset = module.ImageAsset;
      JsonAsset = module.JsonAsset;
    }, function (module) {
      ArtCatalog = module.ArtCatalog;
    }],
    execute: function () {
      cclegacy._RF.push({}, "e3337X3fNpIAZzZa9J6ifeh", "ArtAssets", undefined);
      /** Scene-owned images. Loads ImageAsset so editor-generated SpriteFrame subasset settings are not assumed. */
      var ArtAssets = exports('ArtAssets', /*#__PURE__*/function () {
        function ArtAssets() {
          this.catalog = void 0;
          this.disposed = false;
          this.generation = 1;
          this.registry = null;
          this.loaded = new Map();
          this.pending = new Map();
          this.bundles = new Map();
          this.bundleLoads = new Map();
        }
        var _proto = ArtAssets.prototype;
        _proto.initialize = /*#__PURE__*/function () {
          var _initialize = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
            var json;
            return _regeneratorRuntime().wrap(function _callee$(_context) {
              while (1) switch (_context.prev = _context.next) {
                case 0:
                  _context.next = 2;
                  return new Promise(function (resolve, reject) {
                    return resources.load('art/p1/catalog', JsonAsset, function (error, asset) {
                      return error || !asset ? reject(error != null ? error : new Error('美术索引缺失')) : resolve(asset);
                    });
                  });
                case 2:
                  json = _context.sent;
                  this.assertAlive();
                  json.addRef();
                  this.registry = json;
                  this.catalog = new ArtCatalog(json.json);
                case 7:
                case "end":
                  return _context.stop();
              }
            }, _callee, this);
          }));
          function initialize() {
            return _initialize.apply(this, arguments);
          }
          return initialize;
        }();
        _proto.getLoadedVariant = function getLoadedVariant(assetId) {
          var _this$loaded$get;
          return (_this$loaded$get = this.loaded.get(assetId)) == null ? void 0 : _this$loaded$get.variant;
        };
        _proto.loadedVariantSnapshot = function loadedVariantSnapshot() {
          return Array.from(this.loaded.entries(), function (_ref) {
            var assetId = _ref[0],
              art = _ref[1];
            return {
              assetId: assetId,
              variantId: art.variant.resource_key,
              path: art.variant.png,
              size: art.variant.size,
              alphaInsets: ArtCatalog.insets(art.variant),
              pivot: ArtCatalog.pivot(art.variant)
            };
          });
        };
        _proto.load = /*#__PURE__*/function () {
          var _load = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2(assetId, targetPixels) {
            return _regeneratorRuntime().wrap(function _callee2$(_context2) {
              while (1) switch (_context2.prev = _context2.next) {
                case 0:
                  if (targetPixels === void 0) {
                    targetPixels = 128;
                  }
                  _context2.next = 3;
                  return this.acquire(assetId, targetPixels);
                case 3:
                case "end":
                  return _context2.stop();
              }
            }, _callee2, this);
          }));
          function load(_x, _x2) {
            return _load.apply(this, arguments);
          }
          return load;
        }();
        _proto.setSpriteAsset = function setSpriteAsset(node, assetId) {
          var art = this.loaded.get(assetId),
            sprite = node.getComponent(Sprite);
          if (!art || !sprite) return;
          sprite.spriteFrame = art.frame;
        };
        _proto.createSprite = function createSprite(parent, assetId, widthDu, heightDu, centerPivot) {
          if (centerPivot === void 0) {
            centerPivot = false;
          }
          this.assertAlive();
          var art = this.loaded.get(assetId);
          if (!art) throw new Error("\u56FE\u7247\u5C1A\u672A\u52A0\u8F7D: " + assetId);
          var node = new Node(assetId);
          parent.addChild(node);
          var ui = node.addComponent(UITransform);
          var pivot = centerPivot ? [0.5, 0.5] : ArtCatalog.pivot(art.variant);
          ui.setAnchorPoint(pivot[0], pivot[1]);
          var sprite = node.addComponent(Sprite);
          sprite.sizeMode = Sprite.SizeMode.CUSTOM;
          sprite.trim = false;
          sprite.spriteFrame = art.frame;
          sprite.type = ArtCatalog.insets(art.variant) ? Sprite.Type.SLICED : Sprite.Type.SIMPLE;
          ui.setContentSize(widthDu, heightDu);
          return node;
        };
        _proto.dispose = function dispose() {
          var _this$registry;
          if (this.disposed) return;
          this.disposed = true;
          this.generation++;
          for (var _iterator = _createForOfIteratorHelperLoose(this.loaded.values()), _step; !(_step = _iterator()).done;) {
            var art = _step.value;
            art.frame.destroy();
            art.texture.destroy();
            art.image.decRef();
            this.releaseImage(art.variant);
          }
          this.loaded.clear();
          this.pending.clear();
          (_this$registry = this.registry) == null || _this$registry.decRef();
          this.registry = null;
        };
        _proto.acquire = function acquire(assetId, targetPixels) {
          var _this = this;
          this.assertAlive();
          var loaded = this.loaded.get(assetId);
          if (loaded) return Promise.resolve(loaded);
          var pending = this.pending.get(assetId);
          if (pending) return pending;
          var variant = this.catalog.select(assetId, targetPixels);
          var generation = this.generation;
          var task = this.loadImage(variant).then(function (image) {
            if (_this.disposed || generation !== _this.generation) {
              _this.releaseImage(variant);
              throw new Error('美术加载已取消：资源owner已失效');
            }
            if (!image) throw new Error("\u56FE\u7247\u52A0\u8F7D\u5931\u8D25 " + assetId + ": \u8D44\u6E90\u7F3A\u5931");
            if (image.width !== variant.size[0] || image.height !== variant.size[1]) {
              _this.releaseImage(variant);
              throw new Error("\u56FE\u7247\u5C3A\u5BF8\u4E0D\u7B26: " + assetId);
            }
            image.addRef();
            var texture = new Texture2D();
            texture.image = image;
            var frame = new SpriteFrame();
            frame.texture = texture;
            frame.packable = false;
            var insets = ArtCatalog.insets(variant);
            if (insets) {
              frame.insetLeft = insets[0];
              frame.insetTop = insets[1];
              frame.insetRight = insets[2];
              frame.insetBottom = insets[3];
            }
            var art = {
              variant: variant,
              image: image,
              texture: texture,
              frame: frame
            };
            _this.loaded.set(assetId, art);
            return art;
          })["catch"](function (error) {
            throw new Error("\u56FE\u7247\u52A0\u8F7D\u5931\u8D25 " + assetId + ": " + (error instanceof Error ? error.message : String(error)));
          });
          this.pending.set(assetId, task);
          void task.then(function () {
            if (_this.pending.get(assetId) === task) _this.pending["delete"](assetId);
          }, function () {
            if (_this.pending.get(assetId) === task) _this.pending["delete"](assetId);
          });
          return task;
        };
        _proto.loadImage = /*#__PURE__*/function () {
          var _loadImage = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee3(variant) {
            var bundle;
            return _regeneratorRuntime().wrap(function _callee3$(_context3) {
              while (1) switch (_context3.prev = _context3.next) {
                case 0:
                  if (variant.bundle) {
                    _context3.next = 2;
                    break;
                  }
                  return _context3.abrupt("return", new Promise(function (resolve, reject) {
                    return resources.load(ArtCatalog.imageKey(variant), ImageAsset, function (error, image) {
                      return error || !image ? reject(error != null ? error : new Error('资源缺失')) : resolve(image);
                    });
                  }));
                case 2:
                  _context3.prev = 2;
                  _context3.next = 5;
                  return this.loadBundle(variant.bundle);
                case 5:
                  bundle = _context3.sent;
                  _context3.next = 13;
                  break;
                case 8:
                  _context3.prev = 8;
                  _context3.t0 = _context3["catch"](2);
                  _context3.next = 12;
                  return new Promise(function (resolve, reject) {
                    return resources.load(ArtCatalog.imageKey(variant), ImageAsset, function (error, image) {
                      return error || !image ? reject(error != null ? error : new Error('资源缺失')) : resolve(image);
                    });
                  });
                case 12:
                  return _context3.abrupt("return", _context3.sent);
                case 13:
                  _context3.next = 15;
                  return new Promise(function (resolve, reject) {
                    return bundle.load(ArtCatalog.imageKey(variant), ImageAsset, null, function (error, image) {
                      return error || !image ? reject(error != null ? error : new Error('资源缺失')) : resolve(image);
                    });
                  });
                case 15:
                  return _context3.abrupt("return", _context3.sent);
                case 16:
                case "end":
                  return _context3.stop();
              }
            }, _callee3, this, [[2, 8]]);
          }));
          function loadImage(_x3) {
            return _loadImage.apply(this, arguments);
          }
          return loadImage;
        }();
        _proto.loadBundle = function loadBundle(name) {
          var _this2 = this;
          var ready = this.bundles.get(name);
          if (ready) return Promise.resolve(ready);
          var pending = this.bundleLoads.get(name);
          if (pending) return pending;
          var task = new Promise(function (resolve, reject) {
            return assetManager.loadBundle(name, function (error, bundle) {
              return error || !bundle ? reject(error != null ? error : new Error("Bundle \u7F3A\u5931: " + name)) : resolve(bundle);
            });
          }).then(function (bundle) {
            _this2.bundles.set(name, bundle);
            return bundle;
          });
          this.bundleLoads.set(name, task);
          var clear = function clear() {
            if (_this2.bundleLoads.get(name) === task) _this2.bundleLoads["delete"](name);
          };
          void task.then(clear, clear);
          return task;
        };
        _proto.releaseImage = function releaseImage(variant) {
          var _this$bundles$get;
          if (!variant.bundle) {
            resources.release(ArtCatalog.imageKey(variant), ImageAsset);
            return;
          }
          (_this$bundles$get = this.bundles.get(variant.bundle)) == null || _this$bundles$get.release(ArtCatalog.imageKey(variant), ImageAsset);
        };
        _proto.assertAlive = function assertAlive() {
          if (this.disposed) throw new Error('美术资源持有者已销毁');
        };
        _createClass(ArtAssets, [{
          key: "loadedCount",
          get: function get() {
            return this.loaded.size;
          }
        }]);
        return ArtAssets;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/ArtCatalog.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
  var _createClass, _createForOfIteratorHelperLoose, cclegacy;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      cclegacy._RF.push({}, "7d986YUuW5FyZ5BfH9AfovI", "ArtCatalog", undefined);
      /** Reads the delivered registry. No image paths or ingredient radii are duplicated here. */
      var ArtCatalog = exports('ArtCatalog', /*#__PURE__*/function () {
        function ArtCatalog(raw) {
          var _this = this;
          this.byId = new Map();
          var catalog = raw;
          if (!catalog || !Array.isArray(catalog.variants) || catalog.variants.length === 0) throw new Error('美术索引 variants 缺失');
          var _loop = function _loop() {
            var _v$resource_key, _this$byId$get;
            var v = _step.value;
            if (!v.asset_id || !((_v$resource_key = v.resource_key) != null && _v$resource_key.startsWith('art/p1/')) || !v.resource_key.endsWith('/spriteFrame') || v.bundle !== undefined && v.bundle !== 'common' && v.bundle !== 'classic' || !Array.isArray(v.size) || v.size.length !== 2 || !v.size.every(function (n) {
              return Number.isInteger(n) && n > 0;
            })) {
              var _v$asset_id;
              throw new Error("\u65E0\u6548\u7F8E\u672F\u7D22\u5F15: " + ((_v$asset_id = v.asset_id) != null ? _v$asset_id : 'unknown'));
            }
            ArtCatalog.pivot(v);
            ArtCatalog.insets(v);
            var variants = (_this$byId$get = _this.byId.get(v.asset_id)) != null ? _this$byId$get : [];
            if (variants.some(function (other) {
              return other.resource_key === v.resource_key;
            })) throw new Error("\u91CD\u590D\u7F8E\u672F\u8DEF\u5F84: " + v.resource_key);
            variants.push(v);
            _this.byId.set(v.asset_id, variants);
          };
          for (var _iterator = _createForOfIteratorHelperLoose(catalog.variants), _step; !(_step = _iterator()).done;) {
            _loop();
          }
          for (var _iterator2 = _createForOfIteratorHelperLoose(this.byId.values()), _step2; !(_step2 = _iterator2()).done;) {
            var variants = _step2.value;
            variants.sort(function (a, b) {
              return Math.max.apply(Math, a.size) - Math.max.apply(Math, b.size);
            });
          }
        }
        var _proto = ArtCatalog.prototype;
        _proto.select = function select(assetId, targetPixels) {
          var _variants$find;
          if (!Number.isFinite(targetPixels) || targetPixels <= 0) throw new Error('目标贴图尺寸必须为正有限数');
          var variants = this.byId.get(assetId);
          if (!variants) throw new Error("\u7F3A\u5C11\u7F8E\u672F\u8D44\u6E90: " + assetId);
          return (_variants$find = variants.find(function (v) {
            return Math.max.apply(Math, v.size) >= targetPixels;
          })) != null ? _variants$find : variants[variants.length - 1];
        };
        ArtCatalog.imageKey = function imageKey(variant) {
          return variant.resource_key.replace(/\/spriteFrame$/, '');
        };
        ArtCatalog.pivot = function pivot(variant) {
          var values = variant.pivot.split(',').map(Number);
          if (values.length !== 2 || values.some(function (n) {
            return !Number.isFinite(n) || n < 0 || n > 1;
          })) throw new Error("\u65E0\u6548\u951A\u70B9: " + variant.asset_id);
          return values;
        };
        ArtCatalog.insets = function insets(variant) {
          if (variant.nine_slice === 'none') return null;
          var values = variant.nine_slice.split(',').map(Number);
          if (values.length !== 4 || values.some(function (n) {
            return !Number.isFinite(n) || n < 0;
          }) || values[0] + values[2] > variant.size[0] || values[1] + values[3] > variant.size[1]) throw new Error("\u65E0\u6548\u4E5D\u5207: " + variant.asset_id);
          return values;
        };
        ArtCatalog.ingredientId = function ingredientId(configId) {
          return "spr_ing_" + configId + "_base";
        };
        ArtCatalog.ingredientEdgeDu = function ingredientEdgeDu(radiusDu) {
          if (!Number.isFinite(radiusDu) || radiusDu <= 0) throw new Error('小料半径必须为正有限数');
          return 2 * radiusDu / 0.9;
        };
        _createClass(ArtCatalog, [{
          key: "ids",
          get: function get() {
            return Array.from(this.byId.keys());
          }
        }]);
        return ArtCatalog;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/ArtGallery.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './ArtCatalog.ts'], function (exports) {
  var _asyncToGenerator, _regeneratorRuntime, _createForOfIteratorHelperLoose, cclegacy, Node, UITransform, Label, Color, view, BlockInputEvents, Graphics, ArtCatalog;
  return {
    setters: [function (module) {
      _asyncToGenerator = module.asyncToGenerator;
      _regeneratorRuntime = module.regeneratorRuntime;
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
      Node = module.Node;
      UITransform = module.UITransform;
      Label = module.Label;
      Color = module.Color;
      view = module.view;
      BlockInputEvents = module.BlockInputEvents;
      Graphics = module.Graphics;
    }, function (module) {
      ArtCatalog = module.ArtCatalog;
    }],
    execute: function () {
      cclegacy._RF.push({}, "dfd51dYUh1J5oPszAS6tjy8", "ArtGallery", undefined);

      /** Development-only registry preview. Viewing UI skins does not enable their future gameplay. */
      var ArtGallery = exports('ArtGallery', /*#__PURE__*/function () {
        function ArtGallery(parent, art, onClose) {
          this.root = void 0;
          this.title = void 0;
          this.content = void 0;
          this.generation = 0;
          this.closed = false;
          this.page = 0;
          this.pageSize = 12;
          this.art = art;
          this.onClose = onClose;
          this.root = new Node('P1ArtGallery');
          parent.addChild(this.root);
          this.root.addComponent(UITransform).setContentSize(750, 1334);
          this.root.addComponent(BlockInputEvents);
          this.content = new Node('GalleryPage');
          this.root.addChild(this.content);
          this.title = this.label(this.root, 'P1素材加载中…', 26, 700, 70, 0, 490);
          this.createTouchControls();
          void this.showPage();
        }
        var _proto = ArtGallery.prototype;
        _proto.turn = function turn(direction) {
          var total = Math.ceil(this.art.catalog.ids.length / this.pageSize);
          this.page = (this.page + direction + total) % total;
          void this.showPage();
        };
        _proto.close = function close() {
          this.closed = true;
          this.generation++;
          this.root.destroy();
        };
        _proto.showPage = /*#__PURE__*/function () {
          var _showPage = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
            var _this = this;
            var generation, ids, _iterator, _step, node, panelVariant;
            return _regeneratorRuntime().wrap(function _callee$(_context) {
              while (1) switch (_context.prev = _context.next) {
                case 0:
                  generation = ++this.generation;
                  ids = this.art.catalog.ids.slice(this.page * this.pageSize, (this.page + 1) * this.pageSize);
                  this.title.string = "P1\u7D20\u6750 " + (this.page + 1) + "/" + Math.ceil(this.art.catalog.ids.length / this.pageSize) + " \xB7 \u52A0\u8F7D\u4E2D";
                  _context.prev = 3;
                  _context.next = 6;
                  return Promise.all(['ui_panel_modal'].concat(ids).map(function (id) {
                    return _this.art.load(id, 160);
                  }));
                case 6:
                  if (!(this.closed || generation !== this.generation)) {
                    _context.next = 8;
                    break;
                  }
                  return _context.abrupt("return");
                case 8:
                  for (_iterator = _createForOfIteratorHelperLoose(this.content.children.slice()); !(_step = _iterator()).done;) {
                    node = _step.value;
                    node.destroy();
                  }
                  panelVariant = this.art.getLoadedVariant('ui_panel_modal');
                  if (panelVariant) {
                    _context.next = 12;
                    break;
                  }
                  throw new Error('图库面板实际加载variant缺失');
                case 12:
                  this.art.createSprite(this.content, 'ui_panel_modal', 720, 1100);
                  ids.forEach(function (id, index) {
                    var v = _this.art.getLoadedVariant(id);
                    if (!v) throw new Error("\u56FE\u5E93\u5B9E\u9645\u52A0\u8F7Dvariant\u7F3A\u5931: " + id);
                    var pivot = ArtCatalog.pivot(v);
                    var scale = Math.min(175 / v.size[0], 140 / v.size[1]);
                    var x = (index % 3 - 1) * 225;
                    var y = 335 - Math.floor(index / 3) * 225;
                    var width = v.size[0] * scale;
                    var height = v.size[1] * scale;
                    var sprite = _this.art.createSprite(_this.content, id, width, height);
                    sprite.setPosition(x + (0.5 - pivot[0]) * width, y + (0.5 - pivot[1]) * height, 0);
                    _this.label(_this.content, id, 15, 215, 60, x, y - 95);
                  });
                  this.title.string = "P1\u7D20\u6750 " + (this.page + 1) + "/" + Math.ceil(this.art.catalog.ids.length / this.pageSize) + " \xB7 \u5171" + this.art.catalog.ids.length + "\u9879";
                  _context.next = 20;
                  break;
                case 17:
                  _context.prev = 17;
                  _context.t0 = _context["catch"](3);
                  if (!this.closed && generation === this.generation) this.title.string = "\u56FE\u7247\u8BFB\u53D6\u5931\u8D25\uFF1A" + (_context.t0 instanceof Error ? _context.t0.message : String(_context.t0)) + "\n\u6309\u65B9\u5411\u952E\u91CD\u8BD5";
                case 20:
                case "end":
                  return _context.stop();
              }
            }, _callee, this, [[3, 17]]);
          }));
          function showPage() {
            return _showPage.apply(this, arguments);
          }
          return showPage;
        }();
        _proto.label = function label(parent, text, size, width, height, x, y) {
          var node = new Node('GalleryText');
          parent.addChild(node);
          node.addComponent(UITransform).setContentSize(width, height);
          node.setPosition(x, y, 0);
          var label = node.addComponent(Label);
          label.string = text;
          label.fontSize = size;
          label.lineHeight = size + 4;
          label.overflow = Label.Overflow.CLAMP;
          label.color = new Color(61, 42, 35);
          label.enableWrapText = true;
          return label;
        };
        _proto.createTouchControls = function createTouchControls() {
          var _this2 = this;
          var viewportScale = Math.min(view.getScaleX(), view.getScaleY());
          var scale = viewportScale < 0.35 ? 44 / (96 * viewportScale) : 1;
          var rows = viewportScale < 0.35 ? [-510] : [-540];
          var y = rows[0];
          var buttons = [['‹', -180, function () {
            return _this2.turn(-1);
          }], ['返回', 0, function () {
            return _this2.onClose();
          }], ['›', 180, function () {
            return _this2.turn(1);
          }]];
          var _loop = function _loop() {
            var _buttons$_i = _buttons[_i],
              text = _buttons$_i[0],
              x = _buttons$_i[1],
              action = _buttons$_i[2];
            var button = new Node("GalleryTouch-" + text);
            _this2.root.addChild(button);
            button.setPosition(x, y, 0);
            button.setScale(scale, scale, 1);
            button.addComponent(UITransform).setContentSize(110, 96);
            button.addComponent(BlockInputEvents);
            var graphics = button.addComponent(Graphics);
            graphics.fillColor = new Color(253, 246, 230, 242);
            graphics.roundRect(-53, -46, 106, 92, 12);
            graphics.fill();
            var labelNode = new Node('GalleryTouchLabel');
            button.addChild(labelNode);
            labelNode.addComponent(UITransform).setContentSize(110, 96);
            var label = labelNode.addComponent(Label);
            label.string = text;
            label.fontSize = 30;
            label.lineHeight = 36;
            label.color = new Color(61, 42, 35);
            label.overflow = Label.Overflow.CLAMP;
            button.on(Node.EventType.TOUCH_END, function (event) {
              event.propagationStopped = true;
              action();
            });
          };
          for (var _i = 0, _buttons = buttons; _i < _buttons.length; _i++) {
            _loop();
          }
        };
        return ArtGallery;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/Clock.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
  var _createClass, cclegacy;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
    }, function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      cclegacy._RF.push({}, "d80dc7Yj0RfwLoU3xH6mbQ+", "Clock", undefined);
      /** The sole logical/physics tick owner. Call from one render update only. */
      var FixedClock = exports('FixedClock', /*#__PURE__*/function () {
        function FixedClock(hz, maxCatchupSteps, onStep) {
          this.stepSeconds = void 0;
          this.accumulator = 0;
          this._tick = 0;
          this._paused = false;
          this.hz = hz;
          this.maxCatchupSteps = maxCatchupSteps;
          this.onStep = onStep;
          if (!Number.isFinite(hz) || hz <= 0 || !Number.isInteger(maxCatchupSteps) || maxCatchupSteps < 1) throw new Error('Clock configuration invalid');
          this.stepSeconds = 1 / hz;
        }
        var _proto = FixedClock.prototype;
        _proto.pause = function pause() {
          this._paused = true;
          this.accumulator = 0;
        };
        _proto.resume = function resume() {
          this._paused = false;
          this.accumulator = 0;
        };
        _proto.reset = function reset() {
          this.accumulator = 0;
          this._tick = 0;
        };
        _proto.update = function update(renderDeltaSeconds) {
          if (this._paused) return {
            steps: 0,
            pausedForBacklog: false,
            tick: this._tick,
            droppedSeconds: 0,
            overloaded: false
          };
          if (!Number.isFinite(renderDeltaSeconds) || renderDeltaSeconds < 0) throw new Error('render delta must be finite and non-negative');
          this.accumulator += renderDeltaSeconds;
          var steps = 0;
          var failed = false;
          while (this.accumulator + 1e-12 >= this.stepSeconds && steps < this.maxCatchupSteps) {
            var committed = this.onStep();
            this.accumulator -= this.stepSeconds;
            if (committed === false) {
              this.pause();
              failed = true;
              break;
            }
            this._tick++;
            steps++;
            if (this._paused) break;
          }
          if (failed || this._paused) return {
            steps: steps,
            pausedForBacklog: false,
            tick: this._tick,
            droppedSeconds: 0,
            overloaded: false
          };
          var overloaded = this.accumulator + 1e-12 >= this.stepSeconds;
          var droppedSeconds = 0;
          if (overloaded) {
            var wholeSteps = Math.floor((this.accumulator + 1e-12) / this.stepSeconds);
            droppedSeconds = wholeSteps * this.stepSeconds;
            this.accumulator -= droppedSeconds;
            if (this.accumulator < 0 && this.accumulator > -1e-10) this.accumulator = 0;
          }
          return {
            steps: steps,
            pausedForBacklog: false,
            tick: this._tick,
            droppedSeconds: droppedSeconds,
            overloaded: overloaded
          };
        };
        _createClass(FixedClock, [{
          key: "tick",
          get: function get() {
            return this._tick;
          }
        }, {
          key: "paused",
          get: function get() {
            return this._paused;
          }
        }]);
        return FixedClock;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/CloneState.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      exports('cloneState', cloneState);
      cclegacy._RF.push({}, "e404dVHROBHz6IygLWyefNM", "CloneState", undefined);
      /** Clone plain game state on hosts that do not expose the browser structuredClone API. */
      function cloneState(value) {
        if (typeof structuredClone === 'function') return structuredClone(value);
        var seen = new Map();
        var copy = function copy(item) {
          if (item === null || typeof item !== 'object') return item;
          if (seen.has(item)) return seen.get(item);
          var result = Array.isArray(item) ? [] : {};
          seen.set(item, result);
          for (var _i = 0, _Object$keys = Object.keys(item); _i < _Object$keys.length; _i++) {
            var key = _Object$keys[_i];
            result[key] = copy(item[key]);
          }
          return result;
        };
        return copy(value);
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/CocosPhysicsAdapter.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './CloneState.ts', './CupGeometry.ts'], function (exports) {
  var _extends, _createForOfIteratorHelperLoose, _createClass, cclegacy, BoxCollider2D, Node, RigidBody2D, ERigidBody2DType, Size, Vec2, CircleCollider2D, PhysicsSystem2D, Contact2DType, Vec3, cloneState, CupGeometry;
  return {
    setters: [function (module) {
      _extends = module.extends;
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
      _createClass = module.createClass;
    }, function (module) {
      cclegacy = module.cclegacy;
      BoxCollider2D = module.BoxCollider2D;
      Node = module.Node;
      RigidBody2D = module.RigidBody2D;
      ERigidBody2DType = module.ERigidBody2DType;
      Size = module.Size;
      Vec2 = module.Vec2;
      CircleCollider2D = module.CircleCollider2D;
      PhysicsSystem2D = module.PhysicsSystem2D;
      Contact2DType = module.Contact2DType;
      Vec3 = module.Vec3;
    }, function (module) {
      cloneState = module.cloneState;
    }, function (module) {
      CupGeometry = module.CupGeometry;
    }],
    execute: function () {
      cclegacy._RF.push({}, "f5fceJcnHJbl6TyEY6S1/1V", "CocosPhysicsAdapter", undefined);
      var EMPTY_SEGMENTS = Object.freeze([]);
      // Creator 3.8.8's bundled Box2D uses b2_linearSlop=0.008m and
      // b2_polygonRadius=2*b2_linearSlop=0.016m. These are backend geometry metadata,
      // not configured cup thickness or changes to the solver settings.
      var BOX2D_WASM_LINEAR_SLOP_METERS = 0.008;
      var BOX2D_WASM_POLYGON_SKIN_METERS = 0.016;

      /** Physics only. Render children are owned by PhysicsLab and follow these nodes. */
      var CocosPhysicsAdapter = exports('CocosPhysicsAdapter', /*#__PURE__*/function () {
        function CocosPhysicsAdapter(root, rules, mapper) {
          this.bodies = new Map();
          this.colliderOwners = new Map();
          this.activeContacts = new Map();
          this.contactEnumerationReversed = false;
          this.lastEnumeratedContactIds = [];
          this.staticNodes = [];
          this.listenerDisposers = [];
          this.staleCallbackProbes = [];
          this.samplePosition = new Vec3();
          this.stepTimings = {
            syncToPhysics: 0,
            physicsStep: 0,
            syncFromPhysics: 0,
            velocityClamp: 0
          };
          this.timingDiagnostics = false;
          this.fixtureAccelerationProbe = null;
          this.fixtureMergeFault = null;
          this.fixtureMergeCommitCount = 0;
          this.fixtureMergeProbe = null;
          this.fixtureWallProbe = null;
          this.contactBeginCount = 0;
          this.contactEndCount = 0;
          this.disposed = false;
          this.generation = CocosPhysicsAdapter.nextGeneration++;
          this._stepCount = 0;
          this.cupShape = null;
          this.cupOffsetXDu = 0;
          this.cupBodies = [];
          this.root = root;
          this.rules = rules;
          this.mapper = mapper;
        }
        var _proto = CocosPhysicsAdapter.prototype;
        _proto.setFixtureMergeFaultOnce = function setFixtureMergeFaultOnce(point) {
          this.fixtureMergeFault = point;
          this.fixtureMergeCommitCount = 0;
        };
        _proto.enableFixtureMergeProbe = function enableFixtureMergeProbe() {
          this.fixtureMergeProbe = [];
        };
        _proto.enableFixtureWallProbe = function enableFixtureWallProbe() {
          this.fixtureWallProbe = [];
        };
        _proto.readFixtureWallProbe = function readFixtureWallProbe() {
          var _this$fixtureWallProb;
          return cloneState((_this$fixtureWallProb = this.fixtureWallProbe) != null ? _this$fixtureWallProb : []);
        };
        _proto.readFixtureWallGeometry = function readFixtureWallGeometry() {
          var _this = this;
          return this.staticNodes.map(function (node, index) {
            var _this$cupShape, _segment$kind, _segment$innerStart, _segment$innerEnd, _segment$outward, _segment$lengthDu, _segment$thicknessDu, _collider$worldPoints;
            var collider = node.getComponent(BoxCollider2D),
              position = node.position,
              segment = (_this$cupShape = _this.cupShape) == null ? void 0 : _this$cupShape.segments[index];
            var polygonSkinDu = _this.mapper.box2DMetersToDu(BOX2D_WASM_POLYGON_SKIN_METERS),
              linearSlopDu = _this.mapper.box2DMetersToDu(BOX2D_WASM_LINEAR_SLOP_METERS);
            return {
              index: index,
              kind: (_segment$kind = segment == null ? void 0 : segment.kind) != null ? _segment$kind : null,
              innerStart: (_segment$innerStart = segment == null ? void 0 : segment.innerStart) != null ? _segment$innerStart : null,
              innerEnd: (_segment$innerEnd = segment == null ? void 0 : segment.innerEnd) != null ? _segment$innerEnd : null,
              outward: (_segment$outward = segment == null ? void 0 : segment.outward) != null ? _segment$outward : null,
              lengthDu: (_segment$lengthDu = segment == null ? void 0 : segment.lengthDu) != null ? _segment$lengthDu : null,
              thicknessDu: (_segment$thicknessDu = segment == null ? void 0 : segment.thicknessDu) != null ? _segment$thicknessDu : null,
              box2dLinearSlopMeters: BOX2D_WASM_LINEAR_SLOP_METERS,
              box2dLinearSlopDu: linearSlopDu,
              box2dPolygonSkinMeters: BOX2D_WASM_POLYGON_SKIN_METERS,
              box2dPolygonContactSkinDu: polygonSkinDu,
              childWallProjectionMarginDu: polygonSkinDu + linearSlopDu,
              nodePositionDu: {
                x: _this.mapper.cocosWorldToDu(position.x) + _this.rules.viewport.width_du / 2,
                y: _this.mapper.cocosWorldToDu(position.y) + _this.rules.viewport.height_du / 2
              },
              angleDeg: node.angle,
              colliderSizeCocos: collider ? {
                width: collider.size.width,
                height: collider.size.height
              } : null,
              colliderVertexSizeDu: collider ? {
                width: _this.mapper.cocosWorldToDu(collider.size.width),
                height: _this.mapper.cocosWorldToDu(collider.size.height)
              } : null,
              colliderOffsetCocos: collider ? {
                x: collider.offset.x,
                y: collider.offset.y
              } : null,
              worldPointsDu: (_collider$worldPoints = collider == null ? void 0 : collider.worldPoints.map(function (p) {
                return {
                  x: _this.mapper.cocosWorldToDu(p.x) + _this.rules.viewport.width_du / 2,
                  y: _this.mapper.cocosWorldToDu(p.y) + _this.rules.viewport.height_du / 2
                };
              })) != null ? _collider$worldPoints : null,
              worldAabbDu: collider ? {
                x: _this.mapper.cocosWorldToDu(collider.worldAABB.x) + _this.rules.viewport.width_du / 2,
                y: _this.mapper.cocosWorldToDu(collider.worldAABB.y) + _this.rules.viewport.height_du / 2,
                width: _this.mapper.cocosWorldToDu(collider.worldAABB.width),
                height: _this.mapper.cocosWorldToDu(collider.worldAABB.height)
              } : null
            };
          });
        };
        _proto.recordFixtureMerge = function recordFixtureMerge(value) {
          var _this2 = this;
          var data = cloneState(value);
          if (this.fixtureMergeProbe) {
            var _this$getBody;
            var child = data.child;
            data.adapterAtCommit = {
              stepCount: this._stepCount,
              child: (child == null ? void 0 : child.entityId) === undefined ? null : (_this$getBody = this.getBody(child.entityId)) != null ? _this$getBody : null,
              parentsStillRegistered: Array.isArray(data.parentIds) ? data.parentIds.map(function (id) {
                return _this2.bodies.has(id);
              }) : null,
              wallGeometry: this.fixtureWallProbe ? this.readFixtureWallGeometry() : undefined
            };
            this.fixtureMergeProbe.push(data);
          }
        };
        _proto.readFixtureMergeProbe = function readFixtureMergeProbe() {
          var _this$fixtureMergePro;
          return cloneState((_this$fixtureMergePro = this.fixtureMergeProbe) != null ? _this$fixtureMergePro : []);
        };
        _proto.setTimingDiagnostics = function setTimingDiagnostics(enabled) {
          this.timingDiagnostics = enabled;
        }
        /** Attempt-scoped diagnostic used only by the real shake sample fixture. */;
        _proto.enableFixtureAccelerationProbe = function enableFixtureAccelerationProbe() {
          this.fixtureAccelerationProbe = [];
        };
        _proto.readFixtureAccelerationProbe = function readFixtureAccelerationProbe() {
          var _this$fixtureAccelera;
          return ((_this$fixtureAccelera = this.fixtureAccelerationProbe) != null ? _this$fixtureAccelera : []).map(function (sample) {
            return _extends({}, sample);
          });
        };
        _proto.createCup = function createCup(stageId, offsetXDu) {
          var _this$rules$stages$fi;
          if (offsetXDu === void 0) {
            offsetXDu = 0;
          }
          this.assertAlive();
          this.destroyCup();
          var scale = (_this$rules$stages$fi = this.rules.stages.find(function (s) {
            return s.id === stageId;
          })) == null ? void 0 : _this$rules$stages$fi.cup_width_scale;
          if (scale === undefined) throw new Error("Unknown stage: " + stageId);
          var cup = this.rules.cup;
          this.cupOffsetXDu = offsetXDu;
          this.cupShape = CupGeometry.build({
            centerXDu: cup.center_x_du + offsetXDu,
            bottomYDu: cup.inner_bottom_y_du,
            topYDu: cup.inner_top_y_du,
            bottomWidthDu: cup.bottom_width_du,
            topWidthDu: cup.top_width_du,
            widthScale: scale
          });
          for (var segmentIndex = 0; segmentIndex < this.cupShape.segments.length; segmentIndex++) {
            var segment = this.cupShape.segments[segmentIndex];
            var node = new Node("CupBoundary-" + segment.kind);
            this.root.addChild(node);
            node.setPosition(this.mapper.duToCocosWorld(segment.center.x - this.rules.viewport.width_du / 2), this.mapper.duToCocosWorld(segment.center.y - this.rules.viewport.height_du / 2), 0);
            node.angle = segment.angleDeg;
            var body = node.addComponent(RigidBody2D);
            body.type = ERigidBody2DType.Kinematic;
            body.enabledContactListener = true;
            body.gravityScale = 0;
            var collider = node.addComponent(BoxCollider2D);
            collider.size = new Size(this.mapper.duToCocosWorld(segment.lengthDu), this.mapper.duToCocosWorld(segment.thicknessDu));
            collider.friction = this.rules.physics.friction;
            collider.restitution = this.rules.physics.restitution;
            collider.apply();
            this.staticNodes.push(node);
            this.cupBodies.push(body);
            this.installContacts(collider, null, "listener:cup:" + segmentIndex);
          }
        };
        _proto.setCupVelocityX = function setCupVelocityX(duPerSecond) {
          this.assertAlive();
          if (!Number.isFinite(duPerSecond)) throw new Error('Cup velocity must be finite');
          var v = this.mapper.duVelocityToBox2D(duPerSecond);
          for (var _iterator = _createForOfIteratorHelperLoose(this.cupBodies), _step; !(_step = _iterator()).done;) {
            var body = _step.value;
            body.linearVelocity = new Vec2(v, 0);
          }
        };
        _proto.getCupOffsetX = function getCupOffsetX() {
          var node = this.staticNodes[0];
          if (!node) return this.cupOffsetXDu;
          var x = this.mapper.cocosWorldToDu(node.position.x) + this.rules.viewport.width_du / 2;
          return x - this.rules.cup.center_x_du;
        };
        _proto.createBody = function createBody(definition) {
          var _definition$angleRadi, _definition$angularVe, _definition$angularVe2;
          this.assertAlive();
          if (this.bodies.has(definition.entityId)) throw new Error("Entity " + definition.entityId + " already exists");
          var item = this.rules.ingredients.find(function (i) {
            return i.level === definition.level;
          });
          if (!item || Math.abs(item.radius_du - definition.radiusDu) > 1e-8) throw new Error("Level/radius mismatch for entity " + definition.entityId);
          if (![definition.positionDu.x, definition.positionDu.y, definition.velocityDuPerSecond.x, definition.velocityDuPerSecond.y].every(Number.isFinite)) throw new Error('Body state must be finite');
          var node = new Node("Ingredient-" + definition.entityId);
          this.root.addChild(node);
          node.setPosition(this.mapper.duToCocosWorld(definition.positionDu.x - this.rules.viewport.width_du / 2), this.mapper.duToCocosWorld(definition.positionDu.y - this.rules.viewport.height_du / 2), 0);
          var angleRadians = (_definition$angleRadi = definition.angleRadians) != null ? _definition$angleRadi : 0;
          if (!Number.isFinite(angleRadians) || !Number.isFinite((_definition$angularVe = definition.angularVelocity) != null ? _definition$angularVe : 0)) throw new Error('Body rotation state must be finite');
          node.angle = angleRadians * 180 / Math.PI;
          var body = node.addComponent(RigidBody2D);
          body.type = ERigidBody2DType.Dynamic;
          body.enabledContactListener = true;
          if (definition.enabledInitially === false) body.enabled = false;
          body.linearDamping = this.rules.physics.linear_damping;
          body.angularDamping = this.rules.physics.angular_damping;
          body.allowSleep = this.rules.physics.sleep;
          body.awakeOnLoad = true;
          var collider = node.addComponent(CircleCollider2D);
          collider.radius = this.mapper.duToCocosWorld(definition.radiusDu);
          collider.density = this.rules.physics.density_relative;
          collider.friction = this.rules.physics.friction;
          collider.restitution = this.rules.physics.restitution;
          collider.apply();
          body.linearVelocity = new Vec2(this.mapper.duVelocityToBox2D(definition.velocityDuPerSecond.x), this.mapper.duVelocityToBox2D(definition.velocityDuPerSecond.y));
          body.angularVelocity = (_definition$angularVe2 = definition.angularVelocity) != null ? _definition$angularVe2 : 0;
          this.bodies.set(definition.entityId, {
            node: node,
            body: body,
            collider: collider,
            radiusDu: definition.radiusDu
          });
          this.colliderOwners.set(collider, {
            entityId: definition.entityId,
            boundaryIndex: null
          });
          this.installContacts(collider, definition.entityId);
        };
        _proto.destroyBody = function destroyBody(entityId) {
          var ref = this.bodies.get(entityId);
          if (!ref) return;
          // Component disable synchronously maps to the installed Box2D body's SetActive(false).
          // Node.destroy alone is deferred by Creator and would leave a collider in the next step.
          ref.body.enabled = false;
          this.colliderOwners["delete"](ref.collider);
          this.removeListener("listener:" + entityId);
          this.removeContactsFor(entityId);
          this.bodies["delete"](entityId);
          ref.node.destroy();
        };
        _proto.replaceParentsWithChild = function replaceParentsWithChild(parents, child) {
          this.assertAlive();
          if (parents[0] === parents[1] || !this.bodies.has(parents[0]) || !this.bodies.has(parents[1]) || this.bodies.has(child.entityId)) {
            return {
              ok: false,
              error: {
                code: 'MERGE_OWNER_INVALID',
                message: '合成父对象或子ID无效',
                retryable: false
              }
            };
          }
          var a = this.bodies.get(parents[0]);
          var b = this.bodies.get(parents[1]);
          var childRef;
          try {
            // There is no PhysicsSystem2D.step between staging and commit. Temporarily deactivate
            // the staged child and both parents through the public Component.enabled lifecycle.
            if (this.fixtureMergeFault === 'create-child-once') {
              this.fixtureMergeFault = null;
              throw new Error('FIXTURE_CREATE_CHILD_ONCE');
            }
            this.createBody(_extends({}, child, {
              enabledInitially: false
            }));
            childRef = this.bodies.get(child.entityId);
            a.body.enabled = false;
            b.body.enabled = false;
            childRef.body.enabled = true;
            if (this.fixtureMergeFault === 'second-commit-once' && ++this.fixtureMergeCommitCount === 2) {
              this.fixtureMergeFault = null;
              throw new Error('FIXTURE_SECOND_COMMIT_ONCE');
            }
            this.removeBodyRecord(parents[0], a);
            this.removeBodyRecord(parents[1], b);
            a.node.destroy();
            b.node.destroy();
            return {
              ok: true,
              data: undefined
            };
          } catch (error) {
            if (childRef) {
              childRef.body.enabled = false;
              this.removeBodyRecord(child.entityId, childRef);
              childRef.node.destroy();
            }
            if (a.node.isValid) {
              a.body.enabled = true;
              this.restoreBodyRecord(parents[0], a);
            }
            if (b.node.isValid) {
              b.body.enabled = true;
              this.restoreBodyRecord(parents[1], b);
            }
            return {
              ok: false,
              error: {
                code: 'MERGE_REPLACE_ROLLED_BACK',
                message: String(error),
                retryable: true
              }
            };
          }
        };
        _proto.stepFixed = function stepFixed() {
          this.assertAlive();
          var physics = PhysicsSystem2D.instance;
          var started = this.timingDiagnostics ? performance.now() : 0;
          physics.physicsWorld.syncSceneToPhysics();
          if (this.timingDiagnostics) {
            this.stepTimings.syncToPhysics = performance.now() - started;
            started = performance.now();
          }
          physics.step(1 / this.rules.physics.fixed_hz);
          if (this.timingDiagnostics) {
            this.stepTimings.physicsStep = performance.now() - started;
            started = performance.now();
          }
          this._stepCount++;
          physics.physicsWorld.syncPhysicsToScene();
          if (this.timingDiagnostics) {
            this.stepTimings.syncFromPhysics = performance.now() - started;
            started = performance.now();
          }
          for (var _iterator2 = _createForOfIteratorHelperLoose(this.bodies.values()), _step2; !(_step2 = _iterator2()).done;) {
            var ref = _step2.value;
            var v = ref.body.linearVelocity;
            var speed = Math.hypot(v.x, v.y);
            var speedDu = this.mapper.box2DVelocityToDu(speed);
            var maxDu = this.rules.physics.max_linear_speed * this.rules.viewport.du_per_spec_physics_unit;
            if (speedDu > maxDu) {
              var scale = maxDu / speedDu;
              ref.body.linearVelocity = new Vec2(v.x * scale, v.y * scale);
            }
            var angularLimit = this.rules.physics.max_angular_speed;
            if (Math.abs(ref.body.angularVelocity) > angularLimit) ref.body.angularVelocity = Math.sign(ref.body.angularVelocity) * angularLimit;
          }
          if (this.timingDiagnostics) this.stepTimings.velocityClamp = performance.now() - started;
        };
        _proto.visitBodySamples = function visitBodySamples(visitor) {
          this.assertAlive();
          for (var _iterator3 = _createForOfIteratorHelperLoose(this.bodies), _step3; !(_step3 = _iterator3()).done;) {
            var _step3$value = _step3.value,
              _id = _step3$value[0],
              ref = _step3$value[1];
            ref.node.getPosition(this.samplePosition);
            var velocity = ref.body.linearVelocity;
            visitor(_id, ref.radiusDu, this.mapper.cocosWorldToDu(this.samplePosition.x) + this.rules.viewport.width_du / 2, this.mapper.cocosWorldToDu(this.samplePosition.y) + this.rules.viewport.height_du / 2, this.mapper.box2DVelocityToDu(velocity.x), this.mapper.box2DVelocityToDu(velocity.y), ref.body.isAwake());
          }
        };
        _proto.applyHorizontalAcceleration = function applyHorizontalAcceleration(entityId, accelerationSpecUnits) {
          var _this$fixtureAccelera2;
          var ref = this.bodies.get(entityId);
          if (!ref) return;
          var accelerationDu = accelerationSpecUnits * this.rules.viewport.du_per_spec_physics_unit;
          var accelerationBox2D = this.mapper.duAccelerationToBox2D(accelerationDu);
          var mass = ref.body.getMass(),
            forceX = accelerationBox2D * mass;
          (_this$fixtureAccelera2 = this.fixtureAccelerationProbe) == null || _this$fixtureAccelera2.push({
            preStepIndex: this._stepCount,
            entityId: entityId,
            accelerationSpecUnits: accelerationSpecUnits,
            accelerationDu: accelerationDu,
            accelerationBox2D: accelerationBox2D,
            mass: mass,
            forceX: forceX
          });
          ref.body.applyForceToCenter(new Vec2(forceX, 0), true);
        };
        _proto.getContacts = function getContacts() {
          var contacts = Array.from(this.activeContacts.values(), function (c) {
            return _extends({}, c);
          });
          if (this.contactEnumerationReversed) contacts.reverse();
          this.lastEnumeratedContactIds = contacts.map(function (c) {
            return c.contactId;
          });
          return contacts;
        }
        /** Fixture-only enumeration perturbation; it does not alter contacts or physics. */;
        _proto.setContactEnumerationReversedForFixture = function setContactEnumerationReversedForFixture(reversed) {
          this.contactEnumerationReversed = reversed;
        };
        _proto.setLinearDampingForTest = function setLinearDampingForTest(entityId, damping) {
          var ref = this.bodies.get(entityId);
          if (!ref) throw new Error("Unknown entity " + entityId);
          if (!Number.isFinite(damping) || damping < 0) throw new Error('damping must be finite and non-negative');
          ref.body.linearDamping = damping;
        };
        _proto.setBodyPositionForTest = function setBodyPositionForTest(entityId, positionDu) {
          var ref = this.bodies.get(entityId);
          if (!ref) throw new Error("Unknown entity " + entityId);
          if (!Number.isFinite(positionDu.x) || !Number.isFinite(positionDu.y)) throw new Error('Test body position must be finite');
          ref.node.setPosition(this.mapper.duToCocosWorld(positionDu.x - this.rules.viewport.width_du / 2), this.mapper.duToCocosWorld(positionDu.y - this.rules.viewport.height_du / 2), 0);
          ref.body.wakeUp();
        };
        _proto.setBodyVelocityForTest = function setBodyVelocityForTest(entityId, velocityDuPerSecond) {
          var ref = this.bodies.get(entityId);
          if (!ref) throw new Error("Unknown entity " + entityId);
          if (!Number.isFinite(velocityDuPerSecond.x) || !Number.isFinite(velocityDuPerSecond.y)) throw new Error('Test body velocity must be finite');
          ref.body.linearVelocity = new Vec2(this.mapper.duVelocityToBox2D(velocityDuPerSecond.x), this.mapper.duVelocityToBox2D(velocityDuPerSecond.y));
          ref.body.wakeUp();
        };
        _proto.getBody = function getBody(entityId) {
          var ref = this.bodies.get(entityId);
          if (!ref) return undefined;
          var pos = ref.node.position;
          var v = ref.body.linearVelocity;
          return {
            entityId: entityId,
            positionDu: {
              x: this.mapper.cocosWorldToDu(pos.x) + this.rules.viewport.width_du / 2,
              y: this.mapper.cocosWorldToDu(pos.y) + this.rules.viewport.height_du / 2
            },
            velocityDuPerSecond: {
              x: this.mapper.box2DVelocityToDu(v.x),
              y: this.mapper.box2DVelocityToDu(v.y)
            },
            angleRadians: ref.node.angle * Math.PI / 180,
            angularVelocity: ref.body.angularVelocity,
            sleeping: !ref.body.isAwake()
          };
        };
        _proto.restoreBodies = function restoreBodies(states) {
          var _this3 = this;
          for (var _i = 0, _Array$from = Array.from(this.bodies.keys()); _i < _Array$from.length; _i++) {
            var _id2 = _Array$from[_i];
            this.destroyBody(_id2);
          }
          var _loop = function _loop() {
            var s = _step4.value;
            var def = _this3.rules.ingredients.find(function (i) {
              return i.level === s.level;
            });
            if (!def) throw new Error("Unknown level " + s.level);
            _this3.createBody({
              entityId: s.entityId,
              level: s.level,
              radiusDu: def.radius_du,
              positionDu: s.positionDu,
              velocityDuPerSecond: s.velocityDuPerSecond
            });
            var ref = _this3.bodies.get(s.entityId);
            ref.node.angle = s.angleRadians * 180 / Math.PI;
            ref.body.angularVelocity = s.angularVelocity;
            if (s.sleeping) ref.body.sleep();
          };
          for (var _iterator4 = _createForOfIteratorHelperLoose(states), _step4; !(_step4 = _iterator4()).done;) {
            _loop();
          }
        };
        _proto.canSpawn = function canSpawn(level, xDu) {
          return this.spawnRejectionReason(level, xDu) === null;
        };
        _proto.spawnRejectionReason = function spawnRejectionReason(level, xDu) {
          var _this$rules$ingredien;
          var radius = (_this$rules$ingredien = this.rules.ingredients.find(function (i) {
            return i.level === level;
          })) == null ? void 0 : _this$rules$ingredien.radius_du;
          if (!radius || !this.cupShape) return 'invalid_level_or_cup';
          if (xDu - radius < this.cupShape.spawnRange.minX || xDu + radius > this.cupShape.spawnRange.maxX) return 'outside_legal_interval';
          var y = this.rules.cup.spawn_y_du;
          for (var _iterator5 = _createForOfIteratorHelperLoose(this.bodies), _step5; !(_step5 = _iterator5()).done;) {
            var _step5$value = _step5.value,
              _id3 = _step5$value[0],
              ref = _step5$value[1];
            var state = this.getBody(_id3);
            if (Math.hypot(state.positionDu.x - xDu, state.positionDu.y - y) < ref.radiusDu + radius) return "blocked_by_entity:" + _id3;
          }
          return null;
        };
        _proto.dispose = function dispose() {
          if (this.disposed) return;
          for (var _i2 = 0, _Array$from2 = Array.from(this.bodies.keys()); _i2 < _Array$from2.length; _i2++) {
            var _id4 = _Array$from2[_i2];
            this.destroyBody(_id4);
          }
          this.destroyCup();
          this.activeContacts.clear();
          this.colliderOwners.clear();
          for (var _iterator6 = _createForOfIteratorHelperLoose(this.listenerDisposers.slice()), _step6; !(_step6 = _iterator6()).done;) {
            var dispose = _step6.value;
            dispose();
          }
          this.listenerDisposers.length = 0;
          this.disposed = true;
        }
        /** Unit-only stale callback probe. It invokes captured listener closures after dispose and never calls PhysicsSystem.step. */;
        _proto.replayStaleContactCallbacksForTest = function replayStaleContactCallbacksForTest() {
          for (var _iterator7 = _createForOfIteratorHelperLoose(this.staleCallbackProbes), _step7; !(_step7 = _iterator7()).done;) {
            var replay = _step7.value;
            replay();
          }
          return {
            contactCount: this.contactCount,
            beginEvents: this.contactBeginCount,
            endEvents: this.contactEndCount,
            colliderOwners: this.colliderOwners.size
          };
        };
        _proto.installContacts = function installContacts(collider, entityId, listenerName) {
          var _this4 = this;
          if (listenerName === void 0) {
            listenerName = "listener:" + entityId;
          }
          var boundaryIndex = entityId === null ? this.staticNodes.findIndex(function (node) {
            return node === collider.node;
          }) : null;
          var owner = {
            entityId: entityId,
            boundaryIndex: boundaryIndex !== null && boundaryIndex >= 0 ? boundaryIndex : null
          };
          this.colliderOwners.set(collider, owner);
          var generation = this.generation;
          var begin = function begin(self, other, contact) {
            if (!_this4.disposed && generation === _this4.generation && _this4.colliderOwners.get(collider) === owner) _this4.onContact(true, entityId, self, other, contact);
          };
          var end = function end(self, other, contact) {
            if (!_this4.disposed && generation === _this4.generation && _this4.colliderOwners.get(collider) === owner) _this4.onContact(false, entityId, self, other, contact);
          };
          this.staleCallbackProbes.push(function () {
            return begin(collider, collider, null);
          }, function () {
            return end(collider, collider, null);
          });
          collider.on(Contact2DType.BEGIN_CONTACT, begin);
          collider.on(Contact2DType.END_CONTACT, end);
          var dispose = function dispose() {
            collider.off(Contact2DType.BEGIN_CONTACT, begin);
            collider.off(Contact2DType.END_CONTACT, end);
            _this4.colliderOwners["delete"](collider);
          };
          Object.defineProperty(dispose, 'name', {
            value: listenerName
          });
          this.listenerDisposers.push(dispose);
        };
        _proto.onContact = function onContact(begin, selfId, self, other, contact) {
          var _boundaryOwner$bounda,
            _this5 = this;
          var selfOwner = this.colliderOwners.get(self);
          var otherOwner = this.colliderOwners.get(other);
          if (!selfOwner || !otherOwner) return;
          var otherId = this.idFromCollider(other);
          if (selfId === null && otherId === null) return;
          var first = selfId === null ? otherId : otherId === null ? selfId : Math.min(selfId, otherId);
          var second = selfId === null || otherId === null ? null : Math.max(selfId, otherId);
          var boundaryOwner = selfId === null ? selfOwner : otherOwner;
          var boundaryIndex = second === null ? (_boundaryOwner$bounda = boundaryOwner.boundaryIndex) != null ? _boundaryOwner$bounda : -1 : -1;
          if (second === null && boundaryIndex < 0) return;
          var key = second === null ? first + "|cup:" + boundaryIndex : Math.min(first, second) + "|" + Math.max(first, second);
          if (this.fixtureWallProbe) {
            var manifold = null;
            if (contact) {
              var world = contact.getWorldManifold();
              manifold = {
                normal: {
                  x: world.normal.x,
                  y: world.normal.y
                },
                points: world.points.map(function (p) {
                  return {
                    x: _this5.mapper.cocosWorldToDu(p.x) + _this5.rules.viewport.width_du / 2,
                    y: _this5.mapper.cocosWorldToDu(p.y) + _this5.rules.viewport.height_du / 2
                  };
                }),
                separationsDu: world.separations.map(function (v) {
                  return _this5.mapper.box2DMetersToDu(v);
                }),
                touching: contact.isTouching()
              };
            }
            this.fixtureWallProbe.push({
              begin: begin,
              stepCount: this._stepCount,
              selfId: selfId,
              otherId: otherId,
              boundaryIndex: boundaryIndex,
              contactId: key,
              manifold: manifold
            });
          }
          if (!begin) {
            if (this.activeContacts["delete"](key)) this.contactEndCount++;
            return;
          }
          var normalSpeed = 0;
          if (contact != null && contact.colliderA && contact.colliderB) {
            var _this$bodies$get$body, _this$bodies$get, _this$bodies$get$body2, _this$bodies$get2;
            var normal = contact.getWorldManifold().normal;
            var idA = this.idFromCollider(contact.colliderA);
            var idB = this.idFromCollider(contact.colliderB);
            var velocityA = idA === null ? new Vec2(0, 0) : (_this$bodies$get$body = (_this$bodies$get = this.bodies.get(idA)) == null ? void 0 : _this$bodies$get.body.linearVelocity) != null ? _this$bodies$get$body : new Vec2(0, 0);
            var velocityB = idB === null ? new Vec2(0, 0) : (_this$bodies$get$body2 = (_this$bodies$get2 = this.bodies.get(idB)) == null ? void 0 : _this$bodies$get2.body.linearVelocity) != null ? _this$bodies$get$body2 : new Vec2(0, 0);
            var projected = (velocityB.x - velocityA.x) * normal.x + (velocityB.y - velocityA.y) * normal.y;
            normalSpeed = this.mapper.box2DVelocityToDu(Math.abs(projected));
          }
          if (!this.activeContacts.has(key)) this.contactBeginCount++;
          this.activeContacts.set(key, {
            contactId: key,
            firstId: first,
            secondId: second,
            normalSpeed: normalSpeed
          });
        };
        _proto.idFromCollider = function idFromCollider(collider) {
          var _this$colliderOwners$, _this$colliderOwners$2;
          return (_this$colliderOwners$ = (_this$colliderOwners$2 = this.colliderOwners.get(collider)) == null ? void 0 : _this$colliderOwners$2.entityId) != null ? _this$colliderOwners$ : null;
        };
        _proto.removeContactsFor = function removeContactsFor(entityId) {
          for (var _iterator8 = _createForOfIteratorHelperLoose(this.activeContacts), _step8; !(_step8 = _iterator8()).done;) {
            var _step8$value = _step8.value,
              key = _step8$value[0],
              pair = _step8$value[1];
            if (pair.firstId === entityId || pair.secondId === entityId) {
              if (this.activeContacts["delete"](key)) this.contactEndCount++;
            }
          }
        };
        _proto.removeBodyRecord = function removeBodyRecord(entityId, ref) {
          this.colliderOwners["delete"](ref.collider);
          this.removeListener("listener:" + entityId);
          this.removeContactsFor(entityId);
          if (this.bodies.get(entityId) === ref) this.bodies["delete"](entityId);
        };
        _proto.restoreBodyRecord = function restoreBodyRecord(entityId, ref) {
          this.bodies.set(entityId, ref);
          this.colliderOwners.set(ref.collider, {
            entityId: entityId,
            boundaryIndex: null
          });
          if (!this.listenerDisposers.some(function (dispose) {
            return dispose.name === "listener:" + entityId;
          })) this.installContacts(ref.collider, entityId);
        };
        _proto.destroyCup = function destroyCup() {
          for (var i = 0; i < this.staticNodes.length; i++) {
            this.removeListener("listener:cup:" + i);
            this.staticNodes[i].destroy();
          }
          for (var _iterator9 = _createForOfIteratorHelperLoose(this.activeContacts), _step9; !(_step9 = _iterator9()).done;) {
            var _step9$value = _step9.value,
              key = _step9$value[0],
              contact = _step9$value[1];
            if (contact.secondId === null) this.activeContacts["delete"](key);
          }
          this.staticNodes.length = 0;
          this.cupBodies.length = 0;
          this.cupShape = null;
          this.cupOffsetXDu = 0;
        };
        _proto.assertAlive = function assertAlive() {
          if (this.disposed) throw new Error('Physics adapter has been disposed');
        };
        _proto.removeListener = function removeListener(name) {
          var index = this.listenerDisposers.findIndex(function (dispose) {
            return dispose.name === name;
          });
          if (index >= 0) {
            this.listenerDisposers[index]();
            this.listenerDisposers.splice(index, 1);
          }
        };
        _createClass(CocosPhysicsAdapter, [{
          key: "entityCount",
          get: function get() {
            return this.bodies.size;
          }
        }, {
          key: "contactCount",
          get: function get() {
            return this.activeContacts.size;
          }
        }, {
          key: "listenerCount",
          get: function get() {
            return this.listenerDisposers.length;
          }
        }, {
          key: "stepCount",
          get: function get() {
            return this._stepCount;
          }
        }, {
          key: "cupSegments",
          get: function get() {
            var _this$cupShape$segmen, _this$cupShape2;
            return (_this$cupShape$segmen = (_this$cupShape2 = this.cupShape) == null ? void 0 : _this$cupShape2.segments) != null ? _this$cupShape$segmen : EMPTY_SEGMENTS;
          }
        }, {
          key: "contactBeginEvents",
          get: function get() {
            return this.contactBeginCount;
          }
        }, {
          key: "contactEndEvents",
          get: function get() {
            return this.contactEndCount;
          }
        }, {
          key: "wallContactProjectionMarginDu",
          get: function get() {
            return this.mapper.box2DMetersToDu(BOX2D_WASM_POLYGON_SKIN_METERS + BOX2D_WASM_LINEAR_SLOP_METERS);
          }
        }, {
          key: "lastStepTimings",
          get: function get() {
            return this.stepTimings;
          }
        }, {
          key: "fixtureContactEnumeration",
          get: function get() {
            return {
              reversed: this.contactEnumerationReversed,
              contactIds: [].concat(this.lastEnumeratedContactIds)
            };
          }
        }]);
        return CocosPhysicsAdapter;
      }());
      CocosPhysicsAdapter.nextGeneration = 1;
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/ConfigLoader.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
  var _createForOfIteratorHelperLoose, cclegacy;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      cclegacy._RF.push({}, "847e3iYk5hRnp2VlGoeK4jd", "ConfigLoader", undefined);
      var ConfigLoader = exports('ConfigLoader', /*#__PURE__*/function () {
        function ConfigLoader() {}
        ConfigLoader.validate = function validate(raw) {
          try {
            var _c$viewport;
            if (!raw || typeof raw !== 'object') throw new Error('根配置必须是对象');
            var c = raw;
            var finite = function finite(value, path, min, max) {
              if (min === void 0) {
                min = -Infinity;
              }
              if (max === void 0) {
                max = Infinity;
              }
              if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) throw new Error(path + " \u5FC5\u987B\u662F " + min + ".." + max + " \u8303\u56F4\u5185\u7684\u6709\u9650\u6570\u503C");
            };
            var required = function required(value, path) {
              if (value === undefined || value === null) throw new Error("\u7F3A\u5C11\u914D\u7F6E\u9879 " + path);
            };
            required(c.design_rules_version, 'design_rules_version');
            for (var _iterator = _createForOfIteratorHelperLoose(['viewport', 'physics', 'cup', 'cup_motion', 'shake', 'auto_drop', 'spawn_jitter', 'drop', 'ingredients', 'stages']), _step; !(_step = _iterator()).done;) {
              var _key2 = _step.value;
              required(c[_key2], _key2);
            }
            if (!c.physics.gravity || !c.drop || !Array.isArray(c.stages)) throw new Error('physics.gravity、drop、stages结构无效');
            if (((_c$viewport = c.viewport) == null ? void 0 : _c$viewport.world_origin) !== 'bottom_left') throw new Error('viewport.world_origin 必须为 bottom_left');
            finite(c.viewport.width_du, 'viewport.width_du', 1);
            finite(c.viewport.height_du, 'viewport.height_du', 1);
            finite(c.viewport.du_per_spec_physics_unit, 'viewport.du_per_spec_physics_unit', 0.0001);
            finite(c.physics.fixed_hz, 'physics.fixed_hz', 60, 60);
            for (var _i = 0, _Object$entries = Object.entries({
                'physics.gravity.x': c.physics.gravity.x,
                'physics.gravity.y': c.physics.gravity.y,
                'physics.density_relative': c.physics.density_relative,
                'physics.friction': c.physics.friction,
                'physics.restitution': c.physics.restitution,
                'physics.linear_damping': c.physics.linear_damping,
                'physics.angular_damping': c.physics.angular_damping,
                'physics.max_linear_speed': c.physics.max_linear_speed,
                'physics.max_angular_speed': c.physics.max_angular_speed,
                'physics.velocity_iterations': c.physics.velocity_iterations,
                'physics.position_iterations': c.physics.position_iterations,
                'physics.max_catchup_steps': c.physics.max_catchup_steps
              }); _i < _Object$entries.length; _i++) {
              var _Object$entries$_i = _Object$entries[_i],
                path = _Object$entries$_i[0],
                n = _Object$entries$_i[1];
              finite(n, path, path.endsWith('gravity.x') || path.endsWith('gravity.y') ? -Infinity : 0);
            }
            if (c.physics.density_relative <= 0) throw new Error('physics.density_relative 必须大于0');
            if (c.physics.max_linear_speed <= 0 || c.physics.max_angular_speed <= 0) throw new Error('physics速度上限必须大于0');
            if (c.physics.restitution > 1) throw new Error('physics.restitution 必须在0..1之间');
            for (var _iterator2 = _createForOfIteratorHelperLoose(['velocity_iterations', 'position_iterations', 'max_catchup_steps']), _step2; !(_step2 = _iterator2()).done;) {
              var _key3 = _step2.value;
              if (!Number.isInteger(c.physics[_key3]) || c.physics[_key3] < 1) throw new Error("physics." + _key3 + " \u5FC5\u987B\u662F\u6B63\u6574\u6570");
            }
            if (c.physics.shape !== 'circle') throw new Error('physics.shape 当前阶段必须为 circle');
            if (!Array.isArray(c.ingredients) || c.ingredients.length !== 9) throw new Error('ingredients 必须正好包含九级');
            var ids = new Set();
            var levels = new Set();
            for (var _iterator3 = _createForOfIteratorHelperLoose(c.ingredients), _step3; !(_step3 = _iterator3()).done;) {
              var i = _step3.value;
              if (!i || typeof i.id !== 'string' || !i.id.trim() || ids.has(i.id)) throw new Error("\u5C0F\u6599 ID \u7F3A\u5931\u6216\u91CD\u590D: " + (i == null ? void 0 : i.id));
              if (!Number.isInteger(i.level) || i.level < 1 || i.level > 9 || levels.has(i.level)) throw new Error("\u5C0F\u6599\u7B49\u7EA7\u7F3A\u5931\u6216\u91CD\u590D: " + i.level);
              ids.add(i.id);
              levels.add(i.level);
              finite(i.radius_du, "ingredients." + i.id + ".radius_du", 0.01);
              finite(i.merge_score, "ingredients." + i.id + ".merge_score", 0);
              finite(i.units, "ingredients." + i.id + ".units", 1);
            }
            if (!Array.isArray(c.drop.spawn_levels) || c.drop.spawn_levels.length === 0) throw new Error('drop.spawn_levels 不能为空');
            var totalWeight = 0;
            var weightedLevels = new Set();
            for (var _iterator4 = _createForOfIteratorHelperLoose(c.drop.spawn_levels), _step4; !(_step4 = _iterator4()).done;) {
              var item = _step4.value;
              if (!levels.has(item.level)) throw new Error("\u51FA\u6599\u7B49\u7EA7 " + item.level + " \u4E0D\u5B58\u5728");
              if (weightedLevels.has(item.level)) throw new Error("\u51FA\u6599\u7B49\u7EA7\u91CD\u590D: " + item.level);
              weightedLevels.add(item.level);
              finite(item.weight, "drop.spawn_levels." + item.level + ".weight", 0);
              totalWeight += item.weight;
            }
            if (Math.abs(totalWeight - 100) > 1e-9) throw new Error("\u51FA\u6599\u6743\u91CD\u5408\u8BA1\u5FC5\u987B\u4E3A100\uFF0C\u5F53\u524D\u4E3A " + totalWeight);
            for (var _i2 = 0, _Object$entries2 = Object.entries({
                'cup.center_x_du': c.cup.center_x_du,
                'cup.inner_bottom_y_du': c.cup.inner_bottom_y_du,
                'cup.inner_top_y_du': c.cup.inner_top_y_du,
                'cup.bottom_width_du': c.cup.bottom_width_du,
                'cup.top_width_du': c.cup.top_width_du,
                'cup.spawn_y_du': c.cup.spawn_y_du,
                'cup.danger_line_y_du': c.cup.danger_line_y_du
              }); _i2 < _Object$entries2.length; _i2++) {
              var _Object$entries2$_i = _Object$entries2[_i2],
                _path = _Object$entries2$_i[0],
                _n = _Object$entries2$_i[1];
              finite(_n, _path, 0);
            }
            if (c.cup.inner_top_y_du <= c.cup.inner_bottom_y_du || c.cup.bottom_width_du <= 0 || c.cup.top_width_du <= 0) throw new Error('杯体高度和宽度必须为正且高度递增');
            if (c.cup.spawn_y_du > c.viewport.height_du || c.cup.danger_line_y_du > c.viewport.height_du) throw new Error('投放高度和危险线必须位于设计视口内');
            for (var _i3 = 0, _Object$entries3 = Object.entries(c.cup_motion); _i3 < _Object$entries3.length; _i3++) {
              var _Object$entries3$_i = _Object$entries3[_i3],
                key = _Object$entries3$_i[0],
                value = _Object$entries3$_i[1];
              finite(value, "cup_motion." + key, key === 'input_gain' ? 0 : 0);
            }
            if (c.cup_motion.max_offset_du <= 0 || c.cup_motion.max_speed_du_per_second <= 0 || c.cup_motion.acceleration_du_per_second2 <= 0) throw new Error('cup_motion参数必须大于0');
            for (var _iterator5 = _createForOfIteratorHelperLoose(['duration_seconds', 'cooldown_seconds', 'acceleration_amplitude', 'frequency_hz', 'visual_offset_max_du']), _step5; !(_step5 = _iterator5()).done;) {
              var _key4 = _step5.value;
              finite(c.shake[_key4], "shake." + _key4, 0);
            }
            if (typeof c.shake.guaranteed_merge !== 'boolean') throw new Error('shake.guaranteed_merge必须是boolean');
            if (c.shake.duration_seconds <= 0 || c.shake.frequency_hz <= 0 || c.shake.visual_offset_max_du > 6) throw new Error('shake参数超出已验证边界');
            for (var _i4 = 0, _Object$entries4 = Object.entries(c.auto_drop); _i4 < _Object$entries4.length; _i4++) {
              var _Object$entries4$_i = _Object$entries4[_i4],
                _key = _Object$entries4$_i[0],
                _value = _Object$entries4$_i[1];
              finite(_value, "auto_drop." + _key, 1);
              if (!Number.isSafeInteger(_value)) throw new Error("auto_drop." + _key + "\u5FC5\u987B\u662F\u5B89\u5168\u6574\u6570");
            }
            for (var _iterator6 = _createForOfIteratorHelperLoose(['x_offsets_du', 'vx_du_per_second']), _step6; !(_step6 = _iterator6()).done;) {
              var _key5 = _step6.value;
              var values = c.spawn_jitter[_key5];
              if (!Array.isArray(values) || values.length < 2 || values.some(function (v) {
                return !Number.isFinite(v);
              })) throw new Error("spawn_jitter." + _key5 + "\u65E0\u6548");
            }
            if (!Array.isArray(c.stages) || c.stages.length < 1) throw new Error('stages 不能为空');
            var stageIds = new Set();
            var largestRadius = Math.max.apply(Math, c.ingredients.map(function (i) {
              return i.radius_du;
            }));
            for (var _iterator7 = _createForOfIteratorHelperLoose(c.stages), _step7; !(_step7 = _iterator7()).done;) {
              var s = _step7.value;
              if (!s.id || stageIds.has(s.id)) throw new Error("stage ID\u7F3A\u5931\u6216\u91CD\u590D: " + s.id);
              stageIds.add(s.id);
              finite(s.cup_width_scale, "stages." + s.id + ".cup_width_scale", 0.01, 4);
              if (s.id === 'classic' && c.cup.bottom_width_du * s.cup_width_scale < largestRadius * 2) throw new Error("stages." + s.id + " \u676F\u5E95\u653E\u4E0D\u4E0B\u6700\u9AD8\u7EA7\u5C0F\u6599");
              for (var _i5 = 0, _arr = [c.cup.bottom_width_du, c.cup.top_width_du]; _i5 < _arr.length; _i5++) {
                var width = _arr[_i5];
                if (c.cup.center_x_du - width * s.cup_width_scale / 2 < 0 || c.cup.center_x_du + width * s.cup_width_scale / 2 > c.viewport.width_du) {
                  throw new Error("stages." + s.id + " \u676F\u4F53\u5BBD\u5EA6\u8D85\u51FA\u8BBE\u8BA1\u89C6\u53E3");
                }
              }
            }
            return {
              ok: true,
              data: Object.freeze(c)
            };
          } catch (error) {
            return {
              ok: false,
              error: {
                code: 'CONFIG_INVALID',
                message: error instanceof Error ? error.message : String(error),
                retryable: true
              }
            };
          }
        };
        return ConfigLoader;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/CoordinateMapper.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      cclegacy._RF.push({}, "bfbe01LQ45Vto48dFD9VaYM", "CoordinateMapper", undefined);
      /** DU are design pixels. Box2D length is DU/DU-per-spec-unit; Cocos node units are Box2D length*PTM. */
      var CoordinateMapper = exports('CoordinateMapper', /*#__PURE__*/function () {
        function CoordinateMapper(widthDu, heightDu, duPerSpecPhysicsUnit, cocosPtmRatio) {
          this.widthDu = widthDu;
          this.heightDu = heightDu;
          this.duPerSpecPhysicsUnit = duPerSpecPhysicsUnit;
          this.cocosPtmRatio = cocosPtmRatio;
          if (![widthDu, heightDu, duPerSpecPhysicsUnit, cocosPtmRatio].every(Number.isFinite) || widthDu <= 0 || heightDu <= 0 || duPerSpecPhysicsUnit <= 0 || cocosPtmRatio <= 0) throw new Error('Invalid coordinate scale');
        }
        /** Cocos touch/UI screen coordinates use a bottom-left origin. */
        var _proto = CoordinateMapper.prototype;
        _proto.screenToDu = function screenToDu(point, screenWidth, screenHeight) {
          var scale = Math.min(screenWidth / this.widthDu, screenHeight / this.heightDu);
          var offsetX = (screenWidth - this.widthDu * scale) / 2;
          var offsetY = (screenHeight - this.heightDu * scale) / 2;
          return {
            x: (point.x - offsetX) / scale,
            y: (point.y - offsetY) / scale
          };
        };
        _proto.uiTopLeftToDu = function uiTopLeftToDu(point, screenWidth, screenHeight) {
          return this.screenToDu({
            x: point.x,
            y: screenHeight - point.y
          }, screenWidth, screenHeight);
        };
        _proto.duToScreen = function duToScreen(point, screenWidth, screenHeight) {
          var scale = Math.min(screenWidth / this.widthDu, screenHeight / this.heightDu);
          var offsetX = (screenWidth - this.widthDu * scale) / 2;
          var offsetY = (screenHeight - this.heightDu * scale) / 2;
          return {
            x: offsetX + point.x * scale,
            y: offsetY + (this.heightDu - point.y) * scale
          };
        };
        _proto.specAccelerationToDu = function specAccelerationToDu(specUnitsPerSecondSquared) {
          return specUnitsPerSecondSquared * this.duPerSpecPhysicsUnit;
        };
        _proto.duVelocityToSpec = function duVelocityToSpec(duPerSecond) {
          return duPerSecond / this.duPerSpecPhysicsUnit;
        }
        /** RigidBody2D.linearVelocity is in Box2D m/s, not Cocos node-units/s. */;
        _proto.duVelocityToBox2D = function duVelocityToBox2D(duPerSecond) {
          return duPerSecond / this.duPerSpecPhysicsUnit;
        };
        _proto.box2DVelocityToDu = function box2DVelocityToDu(bodyMetersPerSecond) {
          return bodyMetersPerSecond * this.duPerSpecPhysicsUnit;
        };
        _proto.duAccelerationToBox2D = function duAccelerationToBox2D(duPerSecondSquared) {
          return duPerSecondSquared / this.duPerSpecPhysicsUnit;
        }
        /** Cocos node/collider coordinates are pixels; one Box2D meter occupies PTM pixels. */;
        _proto.duToCocosWorld = function duToCocosWorld(du) {
          return du / this.duPerSpecPhysicsUnit * this.cocosPtmRatio;
        };
        _proto.cocosWorldToDu = function cocosWorldToDu(cocosUnits) {
          return cocosUnits / this.cocosPtmRatio * this.duPerSpecPhysicsUnit;
        };
        _proto.duToBox2DMeters = function duToBox2DMeters(du) {
          return du / this.duPerSpecPhysicsUnit;
        };
        _proto.box2DMetersToDu = function box2DMetersToDu(meters) {
          return meters * this.duPerSpecPhysicsUnit;
        }
        /** PhysicsSystem2D.gravity is a Cocos-unit acceleration; its setter divides by PTM. */;
        _proto.specAccelerationToCocosGravityApi = function specAccelerationToCocosGravityApi(specUnitsPerSecondSquared) {
          return specUnitsPerSecondSquared * this.cocosPtmRatio;
        };
        return CoordinateMapper;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/CupGeometry.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      cclegacy._RF.push({}, "61700B9mI5btpo7zK6vVL6v", "CupGeometry", undefined);
      var CupGeometry = exports('CupGeometry', /*#__PURE__*/function () {
        function CupGeometry() {}
        CupGeometry.build = function build(input) {
          var _input$wallThicknessD;
          var cx = input.centerXDu,
            by = input.bottomYDu,
            ty = input.topYDu;
          var scale = input.widthScale;
          var t = (_input$wallThicknessD = input.wallThicknessDu) != null ? _input$wallThicknessD : 16;
          if (![cx, by, ty, input.bottomWidthDu, input.topWidthDu, scale, t].every(Number.isFinite) || ty <= by || scale <= 0 || t <= 0) throw new Error('Invalid cup geometry');
          var bw = input.bottomWidthDu * scale;
          var tw = input.topWidthDu * scale;
          var leftBottom = {
            x: cx - bw / 2,
            y: by
          };
          var rightBottom = {
            x: cx + bw / 2,
            y: by
          };
          var leftTop = {
            x: cx - tw / 2,
            y: ty
          };
          var rightTop = {
            x: cx + tw / 2,
            y: ty
          };
          var make = function make(kind, a, b, outward) {
            var dx = b.x - a.x;
            var dy = b.y - a.y;
            var lengthDu = Math.hypot(dx, dy);
            return {
              kind: kind,
              innerStart: a,
              innerEnd: b,
              center: {
                x: (a.x + b.x) / 2 + outward.x * t / 2,
                y: (a.y + b.y) / 2 + outward.y * t / 2
              },
              lengthDu: lengthDu + t,
              angleDeg: Math.atan2(dy, dx) * 180 / Math.PI,
              thicknessDu: t,
              outward: outward
            };
          };
          var dx = leftTop.x - leftBottom.x;
          var dy = ty - by;
          var len = Math.hypot(dx, dy);
          var leftOut = {
            x: -dy / len,
            y: dx / len
          };
          var rightDx = rightTop.x - rightBottom.x;
          var rightDy = rightTop.y - rightBottom.y;
          var rightLen = Math.hypot(rightDx, rightDy);
          var rightOut = {
            x: rightDy / rightLen,
            y: -rightDx / rightLen
          };
          return {
            leftBottom: leftBottom,
            rightBottom: rightBottom,
            leftTop: leftTop,
            rightTop: rightTop,
            innerWidthAtBottom: bw,
            innerWidthAtTop: tw,
            segments: [make('bottom', leftBottom, rightBottom, {
              x: 0,
              y: -1
            }), make('left', leftBottom, leftTop, leftOut), make('right', rightBottom, rightTop, rightOut)],
            spawnRange: {
              minX: cx - tw / 2,
              maxX: cx + tw / 2
            }
          };
        };
        return CupGeometry;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/CupSweepProbe.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      exports({
        cupWallHandCheck: cupWallHandCheck,
        sampleCupSegmentSweep: sampleCupSegmentSweep
      });
      cclegacy._RF.push({}, "19ae1Nc2m1H+6bMlwR331CG", "CupSweepProbe", undefined);
      /** Output slot contract: face margin, finite wall box margin, endpoint margin, swept hit, escaped-through-wall. */
      var CUP_PROBE_FACE = exports('CUP_PROBE_FACE', 0);
      var CUP_PROBE_BOX = exports('CUP_PROBE_BOX', 1);
      var CUP_PROBE_ENDPOINT = exports('CUP_PROBE_ENDPOINT', 2);
      var CUP_PROBE_SWEPT = exports('CUP_PROBE_SWEPT', 3);
      var CUP_PROBE_ESCAPE = exports('CUP_PROBE_ESCAPE', 4);

      /** Allocation-free read-only geometry sample. `out` is caller-owned and reused. */
      function sampleCupSegmentSweep(segment, x, y, previousX, previousY, radius, hasPrevious, out) {
        var ax = segment.innerStart.x;
        var ay = segment.innerStart.y;
        var dx = segment.innerEnd.x - ax;
        var dy = segment.innerEnd.y - ay;
        var length = Math.hypot(dx, dy);
        var tx = dx / length;
        var ty = dy / length;
        var nx = -segment.outward.x;
        var ny = -segment.outward.y;
        var rx = x - ax;
        var ry = y - ay;
        var u = rx * tx + ry * ty;
        var inward = rx * nx + ry * ny;
        var wall = segment.thicknessDu;
        var halfLength = (length + wall) / 2;
        var localU = u - length / 2;
        var localInward = inward + wall / 2;
        var du = Math.abs(localU) - halfLength;
        var dv = Math.abs(localInward) - wall / 2;
        var outsideU = Math.max(du, 0);
        var outsideV = Math.max(dv, 0);
        var boxDistance = Math.hypot(outsideU, outsideV) + Math.min(Math.max(du, dv), 0);
        var e0u = u;
        var e0v = inward;
        var e1u = u - length;
        var e1v = inward;
        out[CUP_PROBE_FACE] = u >= 0 && u <= length ? inward - radius : Number.POSITIVE_INFINITY;
        out[CUP_PROBE_BOX] = boxDistance - radius;
        out[CUP_PROBE_ENDPOINT] = Math.min(Math.hypot(e0u, e0v), Math.hypot(e1u, e1v)) - radius;
        out[CUP_PROBE_SWEPT] = hasPrevious && sweptCircleHitsSegmentBox(segment, previousX, previousY, x, y, radius) ? 1 : 0;
        var escaped = false;
        if (hasPrevious && out[CUP_PROBE_SWEPT] === 1) {
          var p0u = (previousX - ax) * tx + (previousY - ay) * ty;
          var p0v = (previousX - ax) * nx + (previousY - ay) * ny;
          if (segment.kind === 'bottom') escaped = previousY >= ay && y < ay - radius;else escaped = p0v >= 0 && inward < -radius;
          // Only a trajectory that began on the cup side and crossed the finite collision volume is an escape.
          if (p0u < -wall / 2 - radius || p0u > length + wall / 2 + radius) escaped = false;
        }
        out[CUP_PROBE_ESCAPE] = escaped ? 1 : 0;
      }
      function sweptCircleHitsSegmentBox(segment, x0, y0, x1, y1, radius) {
        var ax = segment.innerStart.x;
        var ay = segment.innerStart.y;
        var dx = segment.innerEnd.x - ax;
        var dy = segment.innerEnd.y - ay;
        var length = Math.hypot(dx, dy);
        var tx = dx / length;
        var ty = dy / length;
        var nx = -segment.outward.x;
        var ny = -segment.outward.y;
        var wall = segment.thicknessDu;
        var u0 = (x0 - ax) * tx + (y0 - ay) * ty;
        var v0 = (x0 - ax) * nx + (y0 - ay) * ny;
        var u1 = (x1 - ax) * tx + (y1 - ay) * ty;
        var v1 = (x1 - ax) * nx + (y1 - ay) * ny;
        var minU = -wall / 2;
        var maxU = length + wall / 2;
        var minV = -wall;
        var maxV = 0;
        if (segmentHitsRect(u0, v0, u1, v1, minU - radius, maxU + radius, minV, maxV) || segmentHitsRect(u0, v0, u1, v1, minU, maxU, minV - radius, maxV + radius)) return true;
        return segmentHitsCircle(u0, v0, u1, v1, minU, minV, radius) || segmentHitsCircle(u0, v0, u1, v1, minU, maxV, radius) || segmentHitsCircle(u0, v0, u1, v1, maxU, minV, radius) || segmentHitsCircle(u0, v0, u1, v1, maxU, maxV, radius);
      }
      function segmentHitsRect(x0, y0, x1, y1, minX, maxX, minY, maxY) {
        var enter = 0;
        var leave = 1;
        var dx = x1 - x0;
        var dy = y1 - y0;
        if (Math.abs(dx) < 1e-12) {
          if (x0 < minX || x0 > maxX) return false;
        } else {
          var a = (minX - x0) / dx;
          var b = (maxX - x0) / dx;
          if (a > b) {
            var swap = a;
            a = b;
            b = swap;
          }
          enter = Math.max(enter, a);
          leave = Math.min(leave, b);
        }
        if (Math.abs(dy) < 1e-12) {
          if (y0 < minY || y0 > maxY) return false;
        } else {
          var _a = (minY - y0) / dy;
          var _b = (maxY - y0) / dy;
          if (_a > _b) {
            var _swap = _a;
            _a = _b;
            _b = _swap;
          }
          enter = Math.max(enter, _a);
          leave = Math.min(leave, _b);
        }
        return enter <= leave && leave >= 0 && enter <= 1;
      }
      function segmentHitsCircle(x0, y0, x1, y1, cx, cy, radius) {
        var dx = x1 - x0;
        var dy = y1 - y0;
        var ox = x0 - cx;
        var oy = y0 - cy;
        var a = dx * dx + dy * dy;
        var c = ox * ox + oy * oy - radius * radius;
        if (a < 1e-18) return c <= 0;
        var b = 2 * (ox * dx + oy * dy);
        var discriminant = b * b - 4 * a * c;
        if (discriminant < 0) return false;
        var root = Math.sqrt(discriminant);
        var t0 = (-b - root) / (2 * a);
        var t1 = (-b + root) / (2 * a);
        return t0 >= 0 && t0 <= 1 || t1 >= 0 && t1 <= 1;
      }
      function cupWallHandCheck(segment, p, radius) {
        var dx = segment.innerEnd.x - segment.innerStart.x;
        var dy = segment.innerEnd.y - segment.innerStart.y;
        var length = Math.hypot(dx, dy);
        var inwardX = -segment.outward.x;
        var inwardY = -segment.outward.y;
        var projection = (p.x - segment.innerStart.x) * dx / length + (p.y - segment.innerStart.y) * dy / length;
        var inward = (p.x - segment.innerStart.x) * inwardX + (p.y - segment.innerStart.y) * inwardY;
        return projection >= 0 && projection <= length ? inward - radius : Number.POSITIVE_INFINITY;
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/DiagnosticRing.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
  var _createClass, cclegacy;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
    }, function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      cclegacy._RF.push({}, "3544bKWpH9PoKRbT3LH0PsK", "DiagnosticRing", undefined);
      /** Fixed-capacity diagnostic log. Sequence numbers never depend on retained array length. */
      var DiagnosticRing = exports('DiagnosticRing', /*#__PURE__*/function () {
        function DiagnosticRing(capacity) {
          this.slots = void 0;
          this._latestSeq = 0;
          this._count = 0;
          this._overflowCount = 0;
          this.capacity = capacity;
          if (!Number.isSafeInteger(capacity) || capacity < 1) throw new Error('DIAGNOSTIC_RING_CAPACITY_INVALID');
          this.slots = new Array(capacity);
        }
        var _proto = DiagnosticRing.prototype;
        _proto.append = function append(value) {
          if (this._latestSeq >= Number.MAX_SAFE_INTEGER) throw new Error('DIAGNOSTIC_SEQUENCE_OVERFLOW');
          var seq = ++this._latestSeq;
          this.slots[(seq - 1) % this.capacity] = {
            seq: seq,
            value: value
          };
          if (this._count < this.capacity) this._count++;else this._overflowCount++;
          return this.slots[(seq - 1) % this.capacity];
        };
        _proto.page = function page(cursor, limit) {
          if (cursor === void 0) {
            cursor = 0;
          }
          if (limit === void 0) {
            limit = 256;
          }
          var safeCursor = Number.isSafeInteger(cursor) && cursor >= 0 ? cursor : 0;
          var safeLimit = Number.isSafeInteger(limit) ? Math.max(1, Math.min(this.capacity, limit)) : 256;
          var oldestSeq = this.oldestSeq;
          var droppedRange = safeCursor < oldestSeq - 1 ? {
            from: safeCursor + 1,
            to: oldestSeq - 1
          } : null;
          var first = Math.max(safeCursor + 1, oldestSeq);
          var last = Math.min(this._latestSeq, first + safeLimit - 1);
          var records = [];
          for (var seq = first; seq <= last; seq++) {
            var record = this.slots[(seq - 1) % this.capacity];
            if (!record || record.seq !== seq) throw new Error("DIAGNOSTIC_RING_SEQUENCE_GAP:" + seq);
            records.push(record);
          }
          return {
            records: records,
            oldestSeq: oldestSeq,
            latestSeq: this._latestSeq,
            nextCursor: records.length ? records[records.length - 1].seq : safeCursor,
            overflowCount: this._overflowCount,
            droppedRange: droppedRange
          };
        };
        _proto.clear = function clear() {
          this.slots.fill(undefined);
          this._latestSeq = 0;
          this._count = 0;
          this._overflowCount = 0;
        };
        _createClass(DiagnosticRing, [{
          key: "latestSeq",
          get: function get() {
            return this._latestSeq;
          }
        }, {
          key: "count",
          get: function get() {
            return this._count;
          }
        }, {
          key: "overflowCount",
          get: function get() {
            return this._overflowCount;
          }
        }, {
          key: "oldestSeq",
          get: function get() {
            return this._count ? this._latestSeq - this._count + 1 : this._latestSeq + 1;
          }
        }]);
        return DiagnosticRing;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/EffectsController.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
  var _createForOfIteratorHelperLoose, _asyncToGenerator, _regeneratorRuntime, cclegacy, Sprite, UIOpacity, resources, ImageAsset, Texture2D, Node, UITransform, SpriteFrame, Rect, Size;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
      _asyncToGenerator = module.asyncToGenerator;
      _regeneratorRuntime = module.regeneratorRuntime;
    }, function (module) {
      cclegacy = module.cclegacy;
      Sprite = module.Sprite;
      UIOpacity = module.UIOpacity;
      resources = module.resources;
      ImageAsset = module.ImageAsset;
      Texture2D = module.Texture2D;
      Node = module.Node;
      UITransform = module.UITransform;
      SpriteFrame = module.SpriteFrame;
      Rect = module.Rect;
      Size = module.Size;
    }],
    execute: function () {
      cclegacy._RF.push({}, "7e6c0q2N9ZO6KQXUaG1YQOg", "EffectsController", undefined);
      var atlasFor = {
        drop: 'contact_spark',
        collision: 'contact_spark',
        merge: 'merge_burst',
        combo: 'combo_star',
        danger: 'danger_glow',
        result: 'settle_stars',
        tap: 'tap_ring'
      };
      var frameCounts = {
        contact_spark: 12,
        merge_burst: 16,
        combo_star: 12,
        danger_glow: 12,
        settle_stars: 16,
        tap_ring: 12
      };
      var cap = {
        drop: 8,
        collision: 8,
        merge: 5,
        combo: 2,
        danger: 1,
        result: 1,
        tap: 8
      };

      /** Cosmetic-only frame atlas player. Its nodes are siblings of game art, never physics bodies. */
      var EffectsController = exports('EffectsController', /*#__PURE__*/function () {
        function EffectsController(root) {
          this.atlases = new Map();
          this.active = [];
          this.generation = 1;
          this.paused = false;
          this.disposed = false;
          this.reducedMotion = false;
          this.loading = new Map();
          this.catImage = null;
          this.catTexture = null;
          this.catTime = 0;
          this.catNode = null;
          this.catX = 0;
          this.catY = 0;
          this.catRequested = false;
          this.root = root;
        }
        var _proto = EffectsController.prototype;
        _proto.setReducedMotion = function setReducedMotion(value) {
          this.reducedMotion = value;
        };
        _proto.setPaused = function setPaused(value) {
          this.paused = value;
        };
        _proto.prepare = /*#__PURE__*/function () {
          var _prepare = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
            var _i, _arr, key;
            return _regeneratorRuntime().wrap(function _callee$(_context) {
              while (1) switch (_context.prev = _context.next) {
                case 0:
                  _i = 0, _arr = ['contact_spark', 'merge_burst', 'combo_star', 'danger_glow', 'settle_stars', 'tap_ring'];
                case 1:
                  if (!(_i < _arr.length)) {
                    _context.next = 8;
                    break;
                  }
                  key = _arr[_i];
                  _context.next = 5;
                  return this.load(key);
                case 5:
                  _i++;
                  _context.next = 1;
                  break;
                case 8:
                case "end":
                  return _context.stop();
              }
            }, _callee, this);
          }));
          function prepare() {
            return _prepare.apply(this, arguments);
          }
          return prepare;
        }();
        _proto.update = function update(dt) {
          var _this$catNode;
          if (this.disposed || this.paused || !Number.isFinite(dt) || dt <= 0) return;
          this.catTime += dt;
          if ((_this$catNode = this.catNode) != null && _this$catNode.isValid) this.catNode.setPosition(this.catX, this.catY + Math.sin(this.catTime * 2.4) * 3, 0);
          for (var i = this.active.length - 1; i >= 0; i--) {
            var a = this.active[i];
            if (!a.node.isValid) {
              this.active.splice(i, 1);
              continue;
            }
            a.age += dt;
            var frame = Math.min(a.atlas.frames.length - 1, Math.floor(a.age * a.atlas.fps));
            var sprite = a.node.getComponent(Sprite);
            if (sprite) sprite.spriteFrame = a.atlas.frames[frame];
            var op = a.node.getComponent(UIOpacity);
            if (op && a.age > a.atlas.frames.length / a.atlas.fps * .72) op.opacity = Math.max(0, Math.round(255 * (1 - (a.age - a.atlas.frames.length / a.atlas.fps * .72) / (a.atlas.frames.length / a.atlas.fps * .28))));
            if (frame >= a.atlas.frames.length - 1) {
              a.node.destroy();
              this.active.splice(i, 1);
            }
          }
        };
        _proto.play = /*#__PURE__*/function () {
          var _play = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2(kind, x, y, owner, reduced) {
            var generation, name, atlas, same, oldest, n;
            return _regeneratorRuntime().wrap(function _callee2$(_context2) {
              while (1) switch (_context2.prev = _context2.next) {
                case 0:
                  if (reduced === void 0) {
                    reduced = this.reducedMotion;
                  }
                  if (!(this.disposed || this.paused || reduced && kind !== 'danger')) {
                    _context2.next = 3;
                    break;
                  }
                  return _context2.abrupt("return");
                case 3:
                  generation = this.generation;
                  name = atlasFor[kind];
                  _context2.next = 7;
                  return this.load(name);
                case 7:
                  atlas = _context2.sent;
                  if (!(!atlas || this.disposed || this.paused || generation !== this.generation || !this.root.isValid)) {
                    _context2.next = 10;
                    break;
                  }
                  return _context2.abrupt("return");
                case 10:
                  same = this.active.filter(function (a) {
                    return a.kind === kind;
                  });
                  if (same.length >= cap[kind]) {
                    oldest = same[0];
                    oldest.node.destroy();
                    this.active = this.active.filter(function (a) {
                      return a !== oldest;
                    });
                  }
                  n = new Node("V2FX-" + kind);
                  this.root.addChild(n);
                  n.setPosition(x - 375, y - 667, 0);
                  n.addComponent(UITransform).setContentSize(kind === 'danger' ? 92 : kind === 'result' ? 220 : kind === 'tap' ? 68 : 112, kind === 'danger' ? 92 : kind === 'result' ? 220 : kind === 'tap' ? 68 : 112);
                  n.addComponent(Sprite).spriteFrame = atlas.frames[0];
                  n.addComponent(UIOpacity).opacity = 255;
                  this.active.push({
                    node: n,
                    kind: kind,
                    age: 0,
                    atlas: atlas,
                    owner: owner
                  });
                case 19:
                case "end":
                  return _context2.stop();
              }
            }, _callee2, this);
          }));
          function play(_x, _x2, _x3, _x4, _x5) {
            return _play.apply(this, arguments);
          }
          return play;
        }();
        _proto.ensureCat = function ensureCat(x, y) {
          var _this$catNode2,
            _this = this;
          if (this.disposed) return;
          this.catRequested = true;
          this.catX = x - 375;
          this.catY = y - 667;
          if ((_this$catNode2 = this.catNode) != null && _this$catNode2.isValid) {
            this.catNode.setPosition(this.catX, this.catY, 0);
            return;
          }
          if (this.catImage) {
            this.makeCat();
            return;
          }
          resources.load('effects/v2/cat_barista', ImageAsset, function (error, image) {
            if (error || !image || _this.disposed || !_this.catRequested) return;
            _this.catImage = image;
            _this.catTexture = new Texture2D();
            _this.catTexture.image = image;
            _this.makeCat();
          });
        };
        _proto.hideCat = function hideCat() {
          var _this$catNode3;
          this.catRequested = false;
          if ((_this$catNode3 = this.catNode) != null && _this$catNode3.isValid) this.catNode.destroy();
          this.catNode = null;
        };
        _proto.makeCat = function makeCat() {
          if (!this.catImage || !this.catTexture || !this.root.isValid) return;
          this.catNode = new Node('V2CatBarista');
          this.root.addChild(this.catNode);
          this.catNode.setPosition(this.catX, this.catY, 0);
          this.catNode.addComponent(UITransform).setContentSize(92, 110);
          var frame = new SpriteFrame();
          frame.reset({
            texture: this.catTexture,
            rect: new Rect(0, 0, this.catImage.width, this.catImage.height),
            originalSize: new Size(this.catImage.width, this.catImage.height)
          });
          var sprite = this.catNode.addComponent(Sprite);
          sprite.sizeMode = Sprite.SizeMode.CUSTOM;
          sprite.trim = false;
          sprite.spriteFrame = frame;
          this.catNode.getComponent(UITransform).setContentSize(92, 110);
        };
        _proto.cancelOwner = function cancelOwner(owner) {
          for (var _iterator = _createForOfIteratorHelperLoose(this.active.filter(function (v) {
              return v.owner === owner;
            })), _step; !(_step = _iterator()).done;) {
            var a = _step.value;
            a.node.destroy();
            this.active.splice(this.active.indexOf(a), 1);
          }
        };
        _proto.dispose = function dispose() {
          var _this$catNode4, _this$catTexture;
          this.disposed = true;
          this.generation++;
          for (var _iterator2 = _createForOfIteratorHelperLoose(this.active), _step2; !(_step2 = _iterator2()).done;) {
            var a = _step2.value;
            a.node.destroy();
          }
          this.active = [];
          for (var _iterator3 = _createForOfIteratorHelperLoose(this.atlases.values()), _step3; !(_step3 = _iterator3()).done;) {
            var atlas = _step3.value;
            for (var _iterator4 = _createForOfIteratorHelperLoose(atlas.frames), _step4; !(_step4 = _iterator4()).done;) {
              var frame = _step4.value;
              frame.destroy();
            }
            atlas.texture.destroy();
          }
          this.atlases.clear();
          if ((_this$catNode4 = this.catNode) != null && _this$catNode4.isValid) this.catNode.destroy();
          this.catNode = null;
          (_this$catTexture = this.catTexture) == null || _this$catTexture.destroy();
          this.catTexture = null;
          this.catImage = null;
        };
        _proto.load = /*#__PURE__*/function () {
          var _load = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee3(name) {
            var _this2 = this;
            var cached, pending, generation, task;
            return _regeneratorRuntime().wrap(function _callee3$(_context3) {
              while (1) switch (_context3.prev = _context3.next) {
                case 0:
                  cached = this.atlases.get(name);
                  if (!cached) {
                    _context3.next = 3;
                    break;
                  }
                  return _context3.abrupt("return", cached);
                case 3:
                  pending = this.loading.get(name);
                  if (!pending) {
                    _context3.next = 6;
                    break;
                  }
                  return _context3.abrupt("return", pending);
                case 6:
                  generation = this.generation;
                  task = new Promise(function (resolve) {
                    var done = function done(error, image) {
                      if (error || !image || _this2.disposed || generation !== _this2.generation) {
                        resolve(null);
                        return;
                      }
                      var texture = new Texture2D();
                      texture.image = image;
                      var frames = [];
                      for (var i = 0; i < frameCounts[name]; i++) {
                        var frame = new SpriteFrame();
                        frame.reset({
                          texture: texture,
                          rect: new Rect(i % 4 * (image.width / 4), Math.floor(i / 4) * (image.width / 4), image.width / 4, image.width / 4),
                          originalSize: new Size(image.width / 4, image.width / 4)
                        });
                        frames.push(frame);
                      }
                      var atlas = {
                        texture: texture,
                        frames: frames,
                        fps: 24
                      };
                      _this2.atlases.set(name, atlas);
                      resolve(atlas);
                    };
                    // Project resource loader is intentionally best effort; missing effects never gate gameplay.
                    resources.load("effects/v2/" + name + "_sheet_4col", ImageAsset, done);
                  });
                  this.loading.set(name, task);
                  void task.then(function () {
                    if (_this2.loading.get(name) === task) _this2.loading["delete"](name);
                  }, function () {
                    if (_this2.loading.get(name) === task) _this2.loading["delete"](name);
                  });
                  return _context3.abrupt("return", task);
                case 11:
                case "end":
                  return _context3.stop();
              }
            }, _callee3, this);
          }));
          function load(_x6) {
            return _load.apply(this, arguments);
          }
          return load;
        }();
        return EffectsController;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/EventIdentity.ts", ['cc', './Sha256.ts'], function (exports) {
  var cclegacy, sha256Utf8;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      sha256Utf8 = module.sha256Utf8;
    }],
    execute: function () {
      exports({
        deterministicEventId: deterministicEventId,
        makeEvent: makeEvent
      });
      cclegacy._RF.push({}, "7a97cDTBFJEcqWwvJDLoVrR", "EventIdentity", undefined);
      function deterministicEventId(runId, type, tick, stable) {
        var hash = sha256Utf8(JSON.stringify([runId, type, tick].concat(stable)));
        var bytes = hash.slice(0, 32).split('');
        bytes[12] = '8';
        bytes[16] = (parseInt(bytes[16], 16) & 3 | 8).toString(16);
        var h = bytes.join('');
        return h.slice(0, 8) + "-" + h.slice(8, 12) + "-" + h.slice(12, 16) + "-" + h.slice(16, 20) + "-" + h.slice(20);
      }
      function makeEvent(event) {
        return event;
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/FakeRewardedAdProvider.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      cclegacy._RF.push({}, "b466aT0ES9H9pYY6twcuVil", "FakeRewardedAdProvider", undefined);
      /** Debug-only outcomes. This module is deleted from Release/Tap packages by strip_p1c_release_debug.cjs. */
      var FakeRewardedAdProvider = exports('FakeRewardedAdProvider', /*#__PURE__*/function () {
        function FakeRewardedAdProvider(mode, policy) {
          this.providerName = 'debug-mock';
          this.shown = false;
          this.mode = mode;
          this.policy = policy;
        }

        /** `?rewardedMock=ok|cancel|fail|unavailable` only exists in Debug builds. */
        FakeRewardedAdProvider.modeFromQuery = function modeFromQuery() {
          try {
            var location = globalThis.location;
            if (!(location != null && location.search)) return null;
            var value = new URLSearchParams(location.search).get('rewardedMock');
            if (value === 'ok' || value === 'cancel' || value === 'fail' || value === 'unavailable') return value;
            return null;
          } catch (_unused) {
            return null;
          }
        };
        var _proto = FakeRewardedAdProvider.prototype;
        _proto.capability = function capability() {
          return 'SUPPORTED';
        };
        _proto.prepare = function prepare() {
          console.info('[debug-mock] simulated rewarded video prepare', {
            mode: this.mode,
            policy: this.policy.policyVersion
          });
          return new Promise(function (resolve) {
            return setTimeout(function () {
              return resolve({
                ok: true,
                data: undefined
              });
            }, 120);
          });
        };
        _proto.show = function show(attemptId) {
          var _this = this;
          console.info('[debug-mock] simulated rewarded video show', {
            attemptId: attemptId,
            mode: this.mode
          });
          this.shown = true;
          return new Promise(function (resolve) {
            return setTimeout(function () {
              if (_this.mode === 'ok') resolve({
                kind: 'COMPLETED',
                attemptId: attemptId
              });else if (_this.mode === 'cancel') resolve({
                kind: 'CANCELLED',
                attemptId: attemptId,
                errorCode: 'MOCK_CLOSED_EARLY'
              });else if (_this.mode === 'unavailable') resolve({
                kind: 'UNAVAILABLE',
                attemptId: attemptId,
                errorCode: 'MOCK_NO_FILL'
              });else resolve({
                kind: 'FAILED',
                attemptId: attemptId,
                errorCode: 'MOCK_FAILED'
              });
            }, 900);
          });
        };
        _proto.dispose = function dispose() {
          if (this.shown) console.info('[debug-mock] simulated rewarded video disposed');
        };
        return FakeRewardedAdProvider;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/GameAudio.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
  var _createForOfIteratorHelperLoose, _extends, cclegacy, Node, AudioSource;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
      _extends = module.extends;
    }, function (module) {
      cclegacy = module.cclegacy;
      Node = module.Node;
      AudioSource = module.AudioSource;
    }],
    execute: function () {
      cclegacy._RF.push({}, "0b8e1nA1M5LAJ5qT40VnAd3", "GameAudio", undefined);
      var PRIORITY = {
        collision_soft: 1,
        ui_tap: 2,
        drop: 2,
        shake_start: 2,
        merge_small: 3,
        merge_large: 3,
        danger_tick: 4,
        result: 5
      };

      /** One scene-owned BGM source and three reusable SFX sources. Clips come from the licensed runtime manifest. */
      var GameAudio = exports('GameAudio', /*#__PURE__*/function () {
        function GameAudio(owner, clips, musicGain, sfxGain) {
          var _clips$bgm_classic;
          this.music = void 0;
          this.voices = void 0;
          this.voiceCues = [null, null, null];
          this.unlocked = false;
          this.disposed = false;
          this.clips = void 0;
          this.clips = _extends({}, clips);
          var musicNode = new Node('P1CAudioBGM');
          owner.addChild(musicNode);
          this.music = musicNode.addComponent(AudioSource);
          this.music.clip = (_clips$bgm_classic = clips.bgm_classic) != null ? _clips$bgm_classic : null;
          this.music.loop = true;
          this.music.playOnAwake = false;
          for (var _i = 0, _Object$values = Object.values(clips); _i < _Object$values.length; _i++) {
            var clip = _Object$values[_i];
            clip == null || clip.addRef();
          }
          this.voices = [0, 1, 2].map(function (index) {
            var node = new Node("P1CAudioSFX-" + (index + 1));
            owner.addChild(node);
            var source = node.addComponent(AudioSource);
            source.playOnAwake = false;
            return source;
          });
          this.setVolumes(musicGain, sfxGain);
        }
        var _proto = GameAudio.prototype;
        _proto.addClip = function addClip(cue, clip) {
          if (this.disposed || this.clips[cue]) return;
          clip.addRef();
          this.clips[cue] = clip;
          if (cue === 'bgm_classic') this.music.clip = clip;
        };
        _proto.setVolumes = function setVolumes(musicGain, sfxGain) {
          this.music.volume = Math.max(0, Math.min(1, musicGain));
          for (var _iterator = _createForOfIteratorHelperLoose(this.voices), _step; !(_step = _iterator()).done;) {
            var source = _step.value;
            source.volume = Math.max(0, Math.min(1, sfxGain));
          }
        }

        /** Call only from a real player gesture; play() is void and this reports a request, not audible output. */;
        _proto.requestMusicFromGesture = function requestMusicFromGesture() {
          if (this.disposed || !this.clips.bgm_classic) return false;
          this.unlocked = true;
          if (!this.music.playing) this.music.play();
          return true;
        };
        _proto.play = function play(cue) {
          var _this = this;
          if (this.disposed || !this.unlocked || !this.clips[cue]) return false;
          var slot = this.voices.findIndex(function (source) {
            return !source.playing;
          });
          if (slot < 0) {
            slot = this.voiceCues.reduce(function (lowest, activeCue, index) {
              return activeCue !== null && (_this.voiceCues[lowest] === null || PRIORITY[activeCue] < PRIORITY[_this.voiceCues[lowest]]) ? index : lowest;
            }, 0);
            var active = this.voiceCues[slot];
            if (active !== null && PRIORITY[active] >= PRIORITY[cue]) return false;
          }
          var source = this.voices[slot];
          source.stop();
          source.clip = this.clips[cue];
          source.play();
          this.voiceCues[slot] = cue;
          return true;
        };
        _proto.pauseForHidden = function pauseForHidden() {
          this.music.pause();
          for (var _iterator2 = _createForOfIteratorHelperLoose(this.voices), _step2; !(_step2 = _iterator2()).done;) {
            var source = _step2.value;
            source.stop();
          }
          this.voiceCues.fill(null);
        };
        _proto.resumeAfterUserGesture = function resumeAfterUserGesture() {
          return this.requestMusicFromGesture();
        };
        _proto.dispose = function dispose() {
          if (this.disposed) return;
          this.disposed = true;
          this.music.stop();
          for (var _iterator3 = _createForOfIteratorHelperLoose(this.voices), _step3; !(_step3 = _iterator3()).done;) {
            var source = _step3.value;
            source.stop();
          }
          for (var _i2 = 0, _Object$values2 = Object.values(this.clips); _i2 < _Object$values2.length; _i2++) {
            var clip = _Object$values2[_i2];
            clip == null || clip.decRef();
          }
          this.voiceCues.fill(null);
        };
        return GameAudio;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/GameRoot.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './Clock.ts', './RunEngine.ts', './HostLifecycleCoordinator.ts', './AppRuntime.ts', './CocosPhysicsAdapter.ts', './ArtAssets.ts', './ArtCatalog.ts', './GameAudio.ts', './LocalSaveRepository.ts', './RewardLedger.ts', './SaveCodec.ts', './SaveValidator.ts', './Sha256.ts', './DiagnosticRing.ts', './RewardedShakeService.ts', './SpillReviveService.ts', './RewardedAdCoordinator.ts', './ReviveLedger.ts', './RewardedAdPolicyLoader.ts', './SpillRevivePolicyLoader.ts', './RewardedAdProviderFactory.ts', './Viewport.ts', './EffectsController.ts'], function (exports) {
  var _inheritsLoose, _createForOfIteratorHelperLoose, _extends, _asyncToGenerator, _regeneratorRuntime, cclegacy, _decorator, input, Input, Node, Color, UITransform, UIOpacity, Graphics, Sprite, assetManager, AudioClip, resources, tween, Vec3, Label, Vec2, Component, Tween, JsonAsset, FixedClock, RunEngine, HostLifecycleCoordinator, AppRuntime, CocosPhysicsAdapter, ArtAssets, ArtCatalog, GameAudio, LocalSaveRepository, RewardLedger, SaveCodec, SaveValidator, sha256Utf8, DiagnosticRing, RewardedShakeService, SpillReviveService, RewardedAdCoordinator, ReviveLedger, RewardedAdPolicyLoader, SpillRevivePolicyLoader, createRewardedAdEnvironment, createReviveAdEnvironment, presentationSize, gameUiPoint, EffectsController;
  return {
    setters: [function (module) {
      _inheritsLoose = module.inheritsLoose;
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
      _extends = module.extends;
      _asyncToGenerator = module.asyncToGenerator;
      _regeneratorRuntime = module.regeneratorRuntime;
    }, function (module) {
      cclegacy = module.cclegacy;
      _decorator = module._decorator;
      input = module.input;
      Input = module.Input;
      Node = module.Node;
      Color = module.Color;
      UITransform = module.UITransform;
      UIOpacity = module.UIOpacity;
      Graphics = module.Graphics;
      Sprite = module.Sprite;
      assetManager = module.assetManager;
      AudioClip = module.AudioClip;
      resources = module.resources;
      tween = module.tween;
      Vec3 = module.Vec3;
      Label = module.Label;
      Vec2 = module.Vec2;
      Component = module.Component;
      Tween = module.Tween;
      JsonAsset = module.JsonAsset;
    }, function (module) {
      FixedClock = module.FixedClock;
    }, function (module) {
      RunEngine = module.RunEngine;
    }, function (module) {
      HostLifecycleCoordinator = module.HostLifecycleCoordinator;
    }, function (module) {
      AppRuntime = module.AppRuntime;
    }, function (module) {
      CocosPhysicsAdapter = module.CocosPhysicsAdapter;
    }, function (module) {
      ArtAssets = module.ArtAssets;
    }, function (module) {
      ArtCatalog = module.ArtCatalog;
    }, function (module) {
      GameAudio = module.GameAudio;
    }, function (module) {
      LocalSaveRepository = module.LocalSaveRepository;
    }, function (module) {
      RewardLedger = module.RewardLedger;
    }, function (module) {
      SaveCodec = module.SaveCodec;
    }, function (module) {
      SaveValidator = module.SaveValidator;
    }, function (module) {
      sha256Utf8 = module.sha256Utf8;
    }, function (module) {
      DiagnosticRing = module.DiagnosticRing;
    }, function (module) {
      RewardedShakeService = module.RewardedShakeService;
    }, function (module) {
      SpillReviveService = module.SpillReviveService;
    }, function (module) {
      RewardedAdCoordinator = module.RewardedAdCoordinator;
    }, function (module) {
      ReviveLedger = module.ReviveLedger;
    }, function (module) {
      RewardedAdPolicyLoader = module.RewardedAdPolicyLoader;
    }, function (module) {
      SpillRevivePolicyLoader = module.SpillRevivePolicyLoader;
    }, function (module) {
      createRewardedAdEnvironment = module.createRewardedAdEnvironment;
      createReviveAdEnvironment = module.createReviveAdEnvironment;
    }, function (module) {
      presentationSize = module.presentationSize;
      gameUiPoint = module.gameUiPoint;
    }, function (module) {
      EffectsController = module.EffectsController;
    }],
    execute: function () {
      var _dec, _class, _class2;
      cclegacy._RF.push({}, "1a480dQ6u5CEo2++TQ15XVx", "GameRoot", undefined);
      var ccclass = _decorator.ccclass;
      var CLOSED_REWARDED_POLICY = Object.freeze({
        enabled: false,
        policyVersion: 'policy-unavailable',
        adUnitId: null,
        placement: 'extra-shake',
        maxExtraShakesPerRun: 5,
        maxDailyRewardedShakes: 5,
        minForegroundSecondsFirstSession: 60,
        requireTutorialComplete: true,
        requireFirstNaturalRunCompleted: true
      });
      var CLOSED_SPILL_REVIVE_POLICY = Object.freeze({
        enabled: false,
        policyVersion: 'policy-unavailable',
        adUnitId: null,
        placement: 'spill-revive',
        maxRevivesPerRun: 1,
        maxDailyRevives: 3,
        clearanceDu: 40,
        autoDropDelayTicks: 120,
        minForegroundSecondsFirstSession: 60,
        requireTutorialComplete: true,
        requireFirstNaturalRunCompleted: true
      });
      function pointSegmentDistance(p, a, b) {
        var vx = b.x - a.x,
          vy = b.y - a.y,
          l2 = vx * vx + vy * vy;
        if (l2 === 0) return Math.hypot(p.x - a.x, p.y - a.y);
        var t = Math.max(0, Math.min(1, ((p.x - a.x) * vx + (p.y - a.y) * vy) / l2));
        return Math.hypot(p.x - a.x - t * vx, p.y - a.y - t * vy);
      }
      function segmentDistance(a, b, c, d) {
        var cross = function cross(p, q, r) {
          return (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
        };
        var on = function on(p, q, r) {
          return r.x >= Math.min(p.x, q.x) - 1e-9 && r.x <= Math.max(p.x, q.x) + 1e-9 && r.y >= Math.min(p.y, q.y) - 1e-9 && r.y <= Math.max(p.y, q.y) + 1e-9;
        };
        var o1 = cross(a, b, c),
          o2 = cross(a, b, d),
          o3 = cross(c, d, a),
          o4 = cross(c, d, b);
        if (o1 * o2 < 0 && o3 * o4 < 0 || Math.abs(o1) < 1e-9 && on(a, b, c) || Math.abs(o2) < 1e-9 && on(a, b, d) || Math.abs(o3) < 1e-9 && on(c, d, a) || Math.abs(o4) < 1e-9 && on(c, d, b)) return 0;
        return Math.min(pointSegmentDistance(a, c, d), pointSegmentDistance(b, c, d), pointSegmentDistance(c, a, b), pointSegmentDistance(d, a, b));
      }
      function circleBoxClearance(p, a, b, outward, thickness, radius) {
        var dx = b.x - a.x,
          dy = b.y - a.y,
          length = Math.hypot(dx, dy),
          tx = dx / length,
          ty = dy / length;
        var along = (p.x - a.x) * tx + (p.y - a.y) * ty,
          depth = (p.x - a.x) * outward.x + (p.y - a.y) * outward.y;
        var qx = Math.abs(along - length / 2) - (length + thickness) / 2,
          qy = Math.abs(depth - thickness / 2) - thickness / 2;
        return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - radius;
      }
      function crossesFiniteCupWall(previous, current, a, b, outward, thickness, radius) {
        var signed = function signed(p) {
          return (p.x - a.x) * outward.x + (p.y - a.y) * outward.y;
        };
        var d0 = signed(previous),
          d1 = signed(current);
        if (!(d0 < -radius && d1 > thickness + radius || d1 < -radius && d0 > thickness + radius)) return false;
        var t = (0 - d0) / (d1 - d0),
          x = previous.x + (current.x - previous.x) * t,
          y = previous.y + (current.y - previous.y) * t;
        var dx = b.x - a.x,
          dy = b.y - a.y,
          length = Math.hypot(dx, dy),
          along = (x - a.x) * (dx / length) + (y - a.y) * (dy / length);
        return along >= -thickness / 2 - radius && along <= length + thickness / 2 + radius;
      }
      function classifyWallPenetration(signedClearanceDu, residualAllowanceDu, previousTicks, persistenceTicks) {
        var penetrationDepthDu = Math.max(0, -signedClearanceDu),
          consecutiveTicks = penetrationDepthDu > residualAllowanceDu ? previousTicks + 1 : 0;
        return {
          penetrationDepthDu: penetrationDepthDu,
          consecutiveTicks: consecutiveTicks,
          persistent: consecutiveTicks >= persistenceTicks
        };
      }

      /** Minimum complete local player loop. Domain writes remain in RunEngine; this class owns UI and scene lifetime. */
      var GameRoot = exports('GameRoot', (_dec = ccclass('P1BGameRoot'), _dec(_class = (_class2 = /*#__PURE__*/function (_Component) {
        _inheritsLoose(GameRoot, _Component);
        function GameRoot() {
          var _this;
          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }
          _this = _Component.call.apply(_Component, [this].concat(args)) || this;
          _this.screen = 'MENU';
          _this.sceneId = 0;
          _this.worldId = 0;
          _this.world = null;
          _this.rear = null;
          _this.front = null;
          _this.fixedBackground = null;
          _this.art = new ArtAssets();
          _this.effects = null;
          _this.artReady = false;
          _this.adapter = null;
          _this.engine = null;
          _this.clock = null;
          _this.audio = null;
          _this.audioLoading = false;
          _this.audioUnlockRequested = false;
          _this.audioFailure = '';
          _this.ingredientViews = new Map();
          _this.shakeArcNodes = [];
          _this.classicBundle = null;
          _this.classicBundleLoad = null;
          _this.audioClips = {};
          _this.audioFailures = new Set();
          _this.repo = new LocalSaveRepository();
          _this.bundle = LocalSaveRepository.emptyBundle();
          _this.bundleRevision = 0;
          _this.rewarded = null;
          _this.rewardedHost = null;
          _this.rewardedPolicyError = '';
          _this.foregroundSeconds = 0;
          _this.spillRevive = null;
          _this.spillReviveHost = null;
          _this.spillRevivePolicyError = '';
          _this.adOverlayKind = 'extra-shake';
          _this.debugRepo = null;
          _this.debugLease = null;
          _this.debugNamespace = null;
          _this.debugMode = false;
          _this.lease = null;
          _this.persistent = false;
          _this.loading = false;
          _this.saveInFlight = false;
          _this.activeSaveTaskId = 0;
          _this.saveTaskSequence = 0;
          _this.saveIdleWaiters = [];
          _this.saveDirty = false;
          _this.settingsDirty = false;
          _this.saveAge = 0;
          _this.baseTick = 0;
          _this.leaseInitialized = false;
          _this.bundleInitialized = false;
          _this.artRetryTask = null;
          _this.artLoadGeneration = 0;
          _this.pendingStartRequested = false;
          _this.buttons = [];
          _this.labels = new Map();
          _this.previewX = 375;
          _this.primaryPointer = null;
          _this.dropStartX = 0;
          _this.dropStartPreviewX = 375;
          _this.pointerKind = null;
          _this.startedInButton = null;
          _this.ignoreMouseUntil = 0;
          _this.ownerEpoch = 0;
          _this.lastCommand = null;
          _this.cupPointerStartX = 0;
          _this.cupPointerStartOffset = 0;
          _this.lastEvents = [];
          _this.events = new DiagnosticRing(4096);
          _this.commands = new DiagnosticRing(512);
          _this.frames = new DiagnosticRing(8192);
          _this.timingSaveMs = 0;
          _this.dangerStepTrace = new DiagnosticRing(4096);
          _this.dangerStepTraceEnabled = false;
          _this.pressureStepTrace = new DiagnosticRing(8192);
          _this.pressureStepTraceEnabled = false;
          _this.pressurePreviousPositions = new Map();
          _this.pressurePenetrationTicks = new Map();
          _this.pauseOwners = new Set();
          _this.lifecycleOff = null;
          _this.notice = '';
          _this.mode = 'drag_release';
          _this.reducedMotion = false;
          _this.settingsReturnScreen = 'MENU';
          _this.tutorialStep = 0;
          _this.tutorialReturnScreen = 'PLAYING';
          _this.resultSaved = false;
          _this.resultFinalized = false;
          _this.resultError = '';
          _this.runBestScoreAtStart = 0;
          _this.uiRoot = null;
          _this.recoveryUsedRunId = null;
          _this.showPhysicsDiagnostics = false;
          _this.previewGraphic = null;
          _this.diagnosticAttemptId = null;
          _this.priorFrameWall = 0;
          _this.lastPresentationMs = 0;
          _this.probeSetting = 'off';
          _this.framePhysicsMs = 0;
          _this.frameLogicMs = 0;
          _this.contactPairs = new Set();
          _this.contactObjectTicks = new Map();
          _this.lastContactFeedbackTick = -60;
          _this.feedbackSequence = 0;
          _this.keydown = function (event) {
            if (event.key.toLowerCase() === 'p') _this.togglePause();else if (event.key.toLowerCase() === 'r') _this.resumeByUser();
          };
          _this.onWindowBlur = function () {
            return _this.cancelPointer();
          };
          _this.artLoading = false;
          _this.buttonSkins = new Map();
          _this.uiRefreshElapsed = 0;
          _this.lastSaveTick = 0;
          _this.lastDangerCueTick = -60;
          _this.consumedDomainEventIds = new Set();
          _this.lastConsumedDomainEvent = null;
          return _this;
        }
        var _proto = GameRoot.prototype;
        _proto.onLoad = function onLoad() {
          var _this2 = this;
          var requestedProbe = new URLSearchParams(location.search).get('p1bProbe');
          this.probeSetting = requestedProbe === 'summary' || requestedProbe === 'full' ? requestedProbe : 'off';
          this.sceneId = GameRoot.nextSceneId++;
          this.lifecycleOff = HostLifecycleCoordinator.subscribe(function (s) {
            return _this2.onLifecycle(s);
          });
          input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
          input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
          input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
          input.on(Input.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
          input.on(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
          input.on(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
          input.on(Input.EventType.MOUSE_UP, this.onMouseUp, this);
          window.addEventListener('keydown', this.keydown);
          window.addEventListener('blur', this.onWindowBlur);
          this.uiRoot = new Node('P1BPlayerUI');
          this.node.addChild(this.uiRoot);
          this.uiRoot.setSiblingIndex(this.node.children.length - 1);
          this.effects = new EffectsController(this.uiRoot);
          void this.initialize();
          // initialize() synchronously paints the player loading UI before its first
          // await. Retire the earlier brand layer so it cannot cover a later shop
          // background inserted at sibling index zero.
          var startupFrame = this.node.getChildByName('MilkTeaStartupFrame');
          if (startupFrame != null && startupFrame.isValid) {
            startupFrame.active = false;
            startupFrame.destroy();
          }
        };
        _proto.initialize = /*#__PURE__*/function () {
          var _initialize = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
            var lock, stored, _AppRuntime$rules;
            return _regeneratorRuntime().wrap(function _callee$(_context) {
              while (1) switch (_context.prev = _context.next) {
                case 0:
                  if (!this.loading) {
                    _context.next = 2;
                    break;
                  }
                  return _context.abrupt("return");
                case 2:
                  this.loading = true;
                  this.artLoading = true;
                  this.render();
                  _context.prev = 5;
                  if (this.leaseInitialized) {
                    _context.next = 17;
                    break;
                  }
                  _context.next = 9;
                  return this.repo.acquireWriteLease();
                case 9:
                  lock = _context.sent;
                  this.leaseInitialized = true;
                  if (!lock.ok) {
                    _context.next = 17;
                    break;
                  }
                  if (this.isOwner()) {
                    _context.next = 15;
                    break;
                  }
                  lock.data.release();
                  return _context.abrupt("return");
                case 15:
                  this.lease = lock.data.release;
                  this.persistent = lock.data.mode === 'persistent';
                case 17:
                  if (this.isOwner()) {
                    _context.next = 19;
                    break;
                  }
                  return _context.abrupt("return");
                case 19:
                  if (this.bundleInitialized) {
                    _context.next = 27;
                    break;
                  }
                  _context.next = 22;
                  return this.repo.readBundle();
                case 22:
                  stored = _context.sent;
                  if (this.isOwner()) {
                    _context.next = 25;
                    break;
                  }
                  return _context.abrupt("return");
                case 25:
                  if (stored.ok) {
                    if (stored.data.envelope) {
                      this.bundle = stored.data.envelope.payload;
                      this.bundleRevision = stored.data.envelope.revision;
                    }
                    if (stored.data.warning) this.notice = stored.data.warning;
                  } else {
                    this.persistent = false;
                    this.notice = "\u5B58\u6863\u4E0D\u53EF\u7EED\u7528\uFF1A" + stored.error.message + "\u3002\u539F\u59CB\u69FD\u4FDD\u7559\uFF1B\u4E3A\u4FDD\u62A4\u5B58\u6863\uFF0C\u5F53\u524D\u7981\u6B62\u6301\u4E45\u5316\u8986\u76D6\u3002";
                  }
                  this.bundleInitialized = true;
                case 27:
                  this.mode = this.bundle.profile.settings.dropMode;
                  this.reducedMotion = this.bundle.profile.settings.reducedMotion;
                  if (this.rewarded) {
                    _context.next = 32;
                    break;
                  }
                  _context.next = 32;
                  return this.initializeRewardedShake();
                case 32:
                  if (this.isOwner()) {
                    _context.next = 34;
                    break;
                  }
                  return _context.abrupt("return");
                case 34:
                  if (this.spillRevive) {
                    _context.next = 37;
                    break;
                  }
                  _context.next = 37;
                  return this.initializeSpillRevive();
                case 37:
                  if (this.isOwner()) {
                    _context.next = 39;
                    break;
                  }
                  return _context.abrupt("return");
                case 39:
                  _context.next = 41;
                  return this.art.initialize();
                case 41:
                  if (this.isOwner()) {
                    _context.next = 44;
                    break;
                  }
                  this.art.dispose();
                  return _context.abrupt("return");
                case 44:
                  this.artReady = true;
                  _context.next = 47;
                  return this.loadRequiredArt();
                case 47:
                  if (this.isOwner()) {
                    _context.next = 50;
                    break;
                  }
                  this.art.dispose();
                  return _context.abrupt("return");
                case 50:
                  this.artLoading = false;
                  this.render();
                  this.bindRewardedShake();
                  this.bindSpillRevive();
                  void this.loadAudioClips();
                  if (this.isOwner()) {
                    _context.next = 57;
                    break;
                  }
                  return _context.abrupt("return");
                case 57:
                  this.publishDiagnostics();
                  if (this.bundle.run) {
                    this.notice = this.bundle.run.rulesVersion === ((_AppRuntime$rules = AppRuntime.rules) == null ? void 0 : _AppRuntime$rules.design_rules_version) ? '发现可续局存档。选择“继续上局”后仍需明确点击继续。' : '发现旧版玩法未完成局；原存档已保留，可取消确认或明确开始新局。';
                  }
                  _context.next = 65;
                  break;
                case 61:
                  _context.prev = 61;
                  _context.t0 = _context["catch"](5);
                  this.artLoading = false;
                  if (this.isOwner()) {
                    this.screen = 'ERROR';
                    this.notice = "\u542F\u52A8\u5931\u8D25\uFF1A" + String(_context.t0);
                    this.render();
                  }
                case 65:
                  _context.prev = 65;
                  if (this.isOwner()) {
                    this.loading = false;
                    if (this.pendingStartRequested && this.artReady && this.screen === 'MENU') {
                      this.pendingStartRequested = false;
                      void this.startNew();
                    }
                  }
                  return _context.finish(65);
                case 68:
                case "end":
                  return _context.stop();
              }
            }, _callee, this, [[5, 61, 65, 68]]);
          }));
          function initialize() {
            return _initialize.apply(this, arguments);
          }
          return initialize;
        }();
        _proto.onDestroy = function onDestroy() {
          var _this$lifecycleOff, _this$clock, _this$engine, _this$effects, _this$audio, _this$debugLease, _this$lease;
          this.ownerEpoch++;
          (_this$lifecycleOff = this.lifecycleOff) == null || _this$lifecycleOff.call(this);
          this.lifecycleOff = null;
          if (this.rewarded && this.rewardedHost) this.rewarded.unbind(this.rewardedHost);
          this.rewardedHost = null;
          if (this.spillRevive && this.spillReviveHost) this.spillRevive.unbind(this.spillReviveHost);
          this.spillReviveHost = null;
          input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
          input.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
          input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
          input.off(Input.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
          input.off(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
          input.off(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
          input.off(Input.EventType.MOUSE_UP, this.onMouseUp, this);
          window.removeEventListener('keydown', this.keydown);
          window.removeEventListener('blur', this.onWindowBlur);
          (_this$clock = this.clock) == null || _this$clock.pause();
          this.clock = null;
          (_this$engine = this.engine) == null || _this$engine.dispose();
          this.engine = null;
          (_this$effects = this.effects) == null || _this$effects.dispose();
          this.effects = null;
          this.art.dispose();
          (_this$audio = this.audio) == null || _this$audio.dispose();
          this.audio = null;
          for (var _i = 0, _arr = Object.keys(this.audioClips); _i < _arr.length; _i++) {
            var cue = _arr[_i];
            this.releaseAudioClip(cue);
          }
          (_this$debugLease = this.debugLease) == null || _this$debugLease.call(this);
          this.debugLease = null;
          this.debugRepo = null;
          (_this$lease = this.lease) == null || _this$lease.call(this);
          this.lease = null;
        };
        _proto.update = function update(dt) {
          var _this$engine$tick, _this$engine2, _this$engine$renderSt, _this$engine3, _this$engine4, _this$rewarded, _this$spillRevive, _this$effects2, _this$effects3;
          var probing = this.probeMode() !== 'off';
          var begin = probing ? performance.now() : 0;
          var before = (_this$engine$tick = (_this$engine2 = this.engine) == null ? void 0 : _this$engine2.tick) != null ? _this$engine$tick : 0;
          var stepCount = 0;
          this.framePhysicsMs = 0;
          this.frameLogicMs = 0;
          if (this.screen === 'PLAYING' && this.tutorialStep === 0 && this.clock && this.engine) {
            try {
              var result = this.clock.update(dt);
              stepCount = result.steps;
              if (result.overloaded && this.probeMode() !== 'off') this.frames.append({
                kind: 'clock-overload',
                tick: result.tick,
                droppedSeconds: result.droppedSeconds,
                steps: result.steps
              });
              if (this.clock.tick + this.baseTick !== this.engine.tick) throw new Error('CLOCK_ENGINE_TICK_DIVERGED');
              this.processEvents();
            } catch (error) {
              this.enterTechnicalError(String(error));
            }
          }
          var presentationStart = probing ? performance.now() : 0;
          var states = (_this$engine$renderSt = (_this$engine3 = this.engine) == null ? void 0 : _this$engine3.renderStates()) != null ? _this$engine$renderSt : null;
          this.syncViews(states);
          this.syncCupArt();
          this.syncViewportBackgrounds();
          this.lastPresentationMs = probing ? performance.now() - presentationStart : 0;
          if (this.engine && this.activeSaveRepository() && this.engine.tick - this.lastSaveTick >= 120) this.saveDirty = true;
          this.saveAge += Math.max(0, dt) * 1000;
          if (this.saveDirty && !this.saveInFlight && ((_this$engine4 = this.engine) == null ? void 0 : _this$engine4.phase) !== 'SETTLING' && this.saveAge >= 250) {
            this.saveAge = 0;
            void this.commitCheckpoint(false);
          }
          if (this.engine && this.engine.phase === 'SETTLING' && !this.resultFinalized && !this.saveInFlight) void this.commitResult();
          if (probing) {
            var _this$engine$tick2, _this$engine5;
            var end = performance.now();
            this.recordFrame(dt, stepCount, before, end - begin, (_this$engine$tick2 = (_this$engine5 = this.engine) == null ? void 0 : _this$engine5.tick) != null ? _this$engine$tick2 : 0);
          }
          if (!this.pauseOwners.has('HOST_HIDDEN') && this.screen !== 'REWARD' && this.screen !== 'REVIVE') this.foregroundSeconds += Math.max(0, dt);
          (_this$rewarded = this.rewarded) == null || _this$rewarded.setForegroundSeconds(this.foregroundSeconds);
          (_this$spillRevive = this.spillRevive) == null || _this$spillRevive.setForegroundSeconds(this.foregroundSeconds);
          (_this$effects2 = this.effects) == null || _this$effects2.setPaused(this.screen === 'PAUSED' || this.screen === 'REWARD' || this.screen === 'REVIVE' || this.pauseOwners.has('HOST_HIDDEN'));
          (_this$effects3 = this.effects) == null || _this$effects3.update(Math.max(0, dt));
          if (this.uiRefreshElapsed >= .12) {
            this.uiRefreshElapsed = 0;
            this.refreshHud();
          } else this.uiRefreshElapsed += Math.max(0, dt);
        };
        _proto.isOwner = function isOwner() {
          return this.isValid && this.sceneId === GameRoot.nextSceneId - 1;
        };
        _proto.onLifecycle = function onLifecycle(state) {
          var _this$engine6;
          if (state.resumeRequired) this.pauseOwners.add('RESUME_REQUIRED');
          var terminal = ((_this$engine6 = this.engine) == null ? void 0 : _this$engine6.phase) === 'SETTLING';
          if (state.backgrounded) {
            var _this$audio2;
            this.pauseOwners.add('HOST_HIDDEN');
            this.cancelPointer();
            (_this$audio2 = this.audio) == null || _this$audio2.pauseForHidden();
            if (this.engine) {
              var _this$clock2;
              this.engine.pause('HOST_HIDDEN');
              (_this$clock2 = this.clock) == null || _this$clock2.pause();
              if (!terminal && !this.isModalScreen()) this.screen = 'PAUSED';
              if (!terminal) {
                this.notice = '应用已进入后台；返回后请点击“继续”。';
                this.saveDirty = true;
                void this.commitCheckpoint(true);
              }
              this.render();
            }
          } else {
            this.pauseOwners["delete"]('HOST_HIDDEN');
            if (this.engine && state.resumeRequired) {
              var _this$clock3;
              this.engine.pause('RESUME_REQUIRED');
              (_this$clock3 = this.clock) == null || _this$clock3.pause();
              if (!terminal && !this.isModalScreen()) this.screen = 'PAUSED';
              if (!terminal) this.notice = '已返回前台；物理保持暂停，请点击“继续”。';
              this.render();
            }
          }
        };
        _proto.initializeRewardedShake = /*#__PURE__*/function () {
          var _initializeRewardedShake = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2() {
            var policy, json, validated;
            return _regeneratorRuntime().wrap(function _callee2$(_context2) {
              while (1) switch (_context2.prev = _context2.next) {
                case 0:
                  policy = CLOSED_REWARDED_POLICY;
                  _context2.prev = 1;
                  _context2.next = 4;
                  return new Promise(function (resolve, reject) {
                    return resources.load('config/rewarded-ad-policy', JsonAsset, function (error, asset) {
                      return error || !asset ? reject(error != null ? error : new Error('激励广告策略缺失')) : resolve(asset.json);
                    });
                  });
                case 4:
                  json = _context2.sent;
                  validated = RewardedAdPolicyLoader.validate(json);
                  if (validated.ok) policy = validated.data;else {
                    this.rewardedPolicyError = validated.error.message;
                    console.warn('[reward] policy invalid', validated.error.message);
                  }
                  _context2.next = 13;
                  break;
                case 9:
                  _context2.prev = 9;
                  _context2.t0 = _context2["catch"](1);
                  this.rewardedPolicyError = String(_context2.t0);
                  console.warn('[reward] policy load failed', String(_context2.t0));
                case 13:
                  this.rewarded = RewardedShakeService.create(createRewardedAdEnvironment(_extends({}, policy)), this.adSaveRepository(), function () {
                    return Date.now();
                  });
                case 14:
                case "end":
                  return _context2.stop();
              }
            }, _callee2, this, [[1, 9]]);
          }));
          function initializeRewardedShake() {
            return _initializeRewardedShake.apply(this, arguments);
          }
          return initializeRewardedShake;
        }();
        _proto.bindRewardedShake = function bindRewardedShake() {
          if (!this.rewarded) return;
          if (!this.rewardedHost) this.rewardedHost = this.makeRewardedHost();
          this.rewarded.setForegroundSeconds(this.foregroundSeconds);
          this.rewarded.bind(this.rewardedHost);
        };
        _proto.makeRewardedHost = function makeRewardedHost() {
          var _this3 = this;
          return {
            getActiveRunSnapshot: function getActiveRunSnapshot() {
              return _this3.activeRunSnapshot();
            },
            getBundle: function getBundle() {
              return _this3.bundle;
            },
            getSaveRevision: function getSaveRevision() {
              return _this3.bundleRevision;
            },
            isTutorialComplete: function isTutorialComplete() {
              var _AppRuntime$rules2;
              return _this3.bundle.profile.settings.tutorialCompleted || _this3.bundle.profile.tutorialRulesVersion === ((_AppRuntime$rules2 = AppRuntime.rules) == null ? void 0 : _AppRuntime$rules2.design_rules_version);
            },
            getForegroundSeconds: function getForegroundSeconds() {
              return _this3.foregroundSeconds;
            },
            pauseForRewardedAd: function pauseForRewardedAd() {
              _this3.adOverlayKind = 'extra-shake';
              _this3.pauseForRewardedAd();
            },
            resumeFromRewardedAd: function resumeFromRewardedAd(notice) {
              return _this3.resumeFromRewardedAd(notice);
            },
            onRewardedShakeChanged: function onRewardedShakeChanged() {
              return _this3.onRewardedChanged();
            },
            onRewardedShakeCommitted: function onRewardedShakeCommitted(bundle, revision) {
              _this3.bundle = bundle;
              _this3.bundleRevision = revision;
            },
            applyCommittedExtraGrant: function applyCommittedExtraGrant() {
              var _this3$engine;
              var applied = (_this3$engine = _this3.engine) == null ? void 0 : _this3$engine.commitExtraGrant(1);
              if (applied && !applied.ok) _this3.enterTechnicalError(applied.error.message);
            },
            waitForSaveIdle: function waitForSaveIdle() {
              return _this3.waitForSaveIdle();
            }
          };
        };
        _proto.initializeSpillRevive = /*#__PURE__*/function () {
          var _initializeSpillRevive = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee3() {
            var policy, json, validated;
            return _regeneratorRuntime().wrap(function _callee3$(_context3) {
              while (1) switch (_context3.prev = _context3.next) {
                case 0:
                  policy = CLOSED_SPILL_REVIVE_POLICY;
                  _context3.prev = 1;
                  _context3.next = 4;
                  return new Promise(function (resolve, reject) {
                    return resources.load('config/spill-revive-policy', JsonAsset, function (error, asset) {
                      return error || !asset ? reject(error != null ? error : new Error('复活广告策略缺失')) : resolve(asset.json);
                    });
                  });
                case 4:
                  json = _context3.sent;
                  validated = SpillRevivePolicyLoader.validate(json);
                  if (validated.ok) policy = validated.data;else {
                    this.spillRevivePolicyError = validated.error.message;
                    console.warn('[revive] policy invalid', validated.error.message);
                  }
                  _context3.next = 13;
                  break;
                case 9:
                  _context3.prev = 9;
                  _context3.t0 = _context3["catch"](1);
                  this.spillRevivePolicyError = String(_context3.t0);
                  console.warn('[revive] policy load failed', String(_context3.t0));
                case 13:
                  this.spillRevive = SpillReviveService.create(createReviveAdEnvironment(_extends({}, policy)), this.adSaveRepository(), function () {
                    return Date.now();
                  });
                case 14:
                case "end":
                  return _context3.stop();
              }
            }, _callee3, this, [[1, 9]]);
          }));
          function initializeSpillRevive() {
            return _initializeSpillRevive.apply(this, arguments);
          }
          return initializeSpillRevive;
        }();
        _proto.bindSpillRevive = function bindSpillRevive() {
          if (!this.spillRevive) return;
          if (!this.spillReviveHost) this.spillReviveHost = this.makeSpillReviveHost();
          this.spillRevive.setForegroundSeconds(this.foregroundSeconds);
          this.spillRevive.bind(this.spillReviveHost);
        };
        _proto.reviveOptions = function reviveOptions() {
          var _this$spillRevive2, _policy$clearanceDu, _policy$autoDropDelay;
          var policy = (_this$spillRevive2 = this.spillRevive) == null ? void 0 : _this$spillRevive2.policy;
          return {
            enabled: !!(policy != null && policy.enabled),
            clearanceDu: (_policy$clearanceDu = policy == null ? void 0 : policy.clearanceDu) != null ? _policy$clearanceDu : 0,
            autoDropDelayTicks: (_policy$autoDropDelay = policy == null ? void 0 : policy.autoDropDelayTicks) != null ? _policy$autoDropDelay : 0
          };
        };
        _proto.makeSpillReviveHost = function makeSpillReviveHost() {
          var _this4 = this;
          return {
            getActiveRunSnapshot: function getActiveRunSnapshot() {
              return _this4.activeRunSnapshot();
            },
            getBundle: function getBundle() {
              return _this4.bundle;
            },
            getSaveRevision: function getSaveRevision() {
              return _this4.bundleRevision;
            },
            isTutorialComplete: function isTutorialComplete() {
              var _AppRuntime$rules3;
              return _this4.bundle.profile.settings.tutorialCompleted || _this4.bundle.profile.tutorialRulesVersion === ((_AppRuntime$rules3 = AppRuntime.rules) == null ? void 0 : _AppRuntime$rules3.design_rules_version);
            },
            getForegroundSeconds: function getForegroundSeconds() {
              return _this4.foregroundSeconds;
            },
            pauseForRewardedAd: function pauseForRewardedAd() {
              _this4.adOverlayKind = 'spill-revive';
              _this4.pauseForRewardedAd();
            },
            resumeFromRewardedAd: function resumeFromRewardedAd(notice) {
              return _this4.resumeFromRewardedAd(notice);
            },
            onSpillReviveChanged: function onSpillReviveChanged() {
              return _this4.onSpillReviveChanged();
            },
            onSpillReviveCommitted: function onSpillReviveCommitted(bundle, revision) {
              _this4.bundle = bundle;
              _this4.bundleRevision = revision;
            },
            projectRevive: function projectRevive(receiptId) {
              return _this4.engine ? _this4.engine.projectRevive(receiptId) : {
                ok: false,
                error: {
                  code: 'NO_RUN',
                  message: 'no active run',
                  retryable: false
                }
              };
            },
            applyCommittedRevive: function applyCommittedRevive(receiptId) {
              var _this4$clock;
              if (!_this4.engine) return false;
              if (_this4.engine.reviveReceiptId === receiptId) return true;
              var applied = _this4.engine.applyRevive(receiptId);
              if (!applied.ok) {
                _this4.notice = applied.error.message;
                return false;
              }
              _this4.pauseOwners.add('AD');
              (_this4$clock = _this4.clock) == null || _this4$clock.pause();
              return true;
            },
            declineSpillRevive: function declineSpillRevive() {
              return _this4.declineSpillRevive();
            },
            waitForSaveIdle: function waitForSaveIdle() {
              return _this4.waitForSaveIdle();
            }
          };
        };
        _proto.reviveView = function reviveView() {
          var _this$spillRevive$get, _this$spillRevive3;
          return (_this$spillRevive$get = (_this$spillRevive3 = this.spillRevive) == null ? void 0 : _this$spillRevive3.getView()) != null ? _this$spillRevive$get : null;
        };
        _proto.onSpillReviveChanged = function onSpillReviveChanged() {
          var _this$reviveView;
          if (!this.spillRevive) return;
          if (this.screen === 'REVIVE') {
            this.render();
            return;
          }
          var message = (_this$reviveView = this.reviveView()) == null ? void 0 : _this$reviveView.message;
          if (message && this.screen === 'PLAYING') {
            this.notice = message;
            this.render();
          }
        };
        _proto.declineSpillRevive = function declineSpillRevive() {
          var _this$engine$declineR, _this$engine7, _this$engine8;
          var ended = (_this$engine$declineR = (_this$engine7 = this.engine) == null ? void 0 : _this$engine7.declineRevive()) != null ? _this$engine$declineR : null;
          if (ended) {
            this.lastEvents.push(ended);
            this.processEvents();
            return;
          }
          if (((_this$engine8 = this.engine) == null ? void 0 : _this$engine8.phase) === 'SETTLING') this.screen = 'RESULTS';else if (this.engine) this.screen = 'PAUSED';
          this.render();
        };
        _proto.enterSpillOffer = function enterSpillOffer() {
          var _this$clock4;
          (_this$clock4 = this.clock) == null || _this$clock4.pause();
          this.cancelPointer();
          this.screen = 'REVIVE';
          this.notice = '';
          this.saveDirty = true;
          this.render();
          void this.commitCheckpoint(true);
        };
        _proto.activeRunSnapshot = function activeRunSnapshot() {
          var _this$engine9;
          var live = (_this$engine9 = this.engine) == null ? void 0 : _this$engine9.snapshot();
          return live && this.bundle.profile.activeRunId === live.runId ? live : this.bundle.run;
        };
        _proto.rewardView = function rewardView() {
          var _this$rewarded$getVie, _this$rewarded2;
          return (_this$rewarded$getVie = (_this$rewarded2 = this.rewarded) == null ? void 0 : _this$rewarded2.getView()) != null ? _this$rewarded$getVie : null;
        };
        _proto.pauseForRewardedAd = function pauseForRewardedAd() {
          var _this$audio3;
          this.cancelPointer();
          this.saveDirty = false;
          this.pauseOwners.add('AD');
          if (this.engine) {
            var _this$clock5;
            this.engine.pause('AD');
            (_this$clock5 = this.clock) == null || _this$clock5.pause();
          }
          (_this$audio3 = this.audio) == null || _this$audio3.pauseForHidden();
          this.screen = this.adOverlayKind === 'spill-revive' ? 'REVIVE' : 'REWARD';
          this.notice = '';
          this.render();
        };
        _proto.resumeFromRewardedAd = function resumeFromRewardedAd(notice) {
          this.pauseOwners["delete"]('AD');
          this.screen = this.engine ? 'PAUSED' : 'MENU';
          this.notice = notice != null ? notice : '';
          this.render();
        };
        _proto.onRewardedChanged = function onRewardedChanged() {
          var _this$rewardView;
          if (!this.rewarded) return;
          if (this.screen === 'REWARD') {
            this.render();
            return;
          }
          var message = (_this$rewardView = this.rewardView()) == null ? void 0 : _this$rewardView.message;
          if (message) {
            this.notice = message;
            this.render();
          }
        };
        _proto.openRewardedOffer = function openRewardedOffer() {
          var _this$rewardView2;
          if (!this.rewarded) {
            this.notice = '广告奖励暂不可用';
            this.render();
            return;
          }
          if (RewardedAdCoordinator.busy()) {
            this.notice = '另有广告正在进行，请稍后再试。';
            this.render();
            return;
          }
          if ((_this$rewardView2 = this.rewardView()) != null && _this$rewardView2.pendingAttempt) {
            this.rewarded.openPendingReview();
            return;
          }
          this.rewarded.openOffer();
        };
        _proto.renderReward = function renderReward() {
          var _this5 = this,
            _view$message;
          var view = this.rewardView();
          this.themePanel('ui_panel_modal', 375, 667, 660, 800, true);
          if (!view) {
            this.text('reward-title', '激励视频', 375, 930, 36);
            this.text('reward-message', '广告组件尚未就绪', 375, 820, 22);
            this.button('reward-back', '返回游戏', 185, 540, 380, 96, function () {
              var _this5$rewarded;
              return (_this5$rewarded = _this5.rewarded) == null ? void 0 : _this5$rewarded.closeOffer();
            });
            return;
          }
          var title = view.phase === 'GRANTED' ? '奖励已到账' : view.phase === 'ERROR' ? '广告奖励' : '额外晃杯';
          this.text('reward-title', title, 375, 950, 38);
          this.text('reward-stats', "\u672C\u5C40\u5956\u52B1 " + view.grantedThisRun + "/" + view.runLimit + "  \xB7  \u4ECA\u65E5\u5269\u4F59 " + view.dailyRemaining, 375, 870, 22);
          var message = view.phase === 'OFFER' ? '观看一段激励视频，本局额外获得 1 次晃杯。\n广告完整看完并保存成功后才计入本局。' : view.phase === 'PREPARING' ? '正在准备激励视频…' : view.phase === 'SHOWING' ? '广告播放中…' : view.phase === 'SETTLING' ? '正在保存奖励…' : view.phase === 'GRANTED' ? '奖励已保存。返回后点击“继续”恢复本局。' : (_view$message = view.message) != null ? _view$message : '广告暂时不可用。';
          this.text('reward-message', message, 375, 770, 23);
          if (view.phase === 'OFFER') {
            this.button('reward-watch', '观看广告 +1 次', 185, 610, 380, 96, function () {
              var _this5$rewarded2;
              return void ((_this5$rewarded2 = _this5.rewarded) == null ? void 0 : _this5$rewarded2.watch());
            });
            this.button('reward-cancel', '取消', 185, 480, 380, 96, function () {
              var _this5$rewarded3;
              return (_this5$rewarded3 = _this5.rewarded) == null ? void 0 : _this5$rewarded3.closeOffer();
            });
          } else if (view.phase === 'GRANTED') {
            this.button('reward-continue', '继续游戏', 185, 520, 380, 96, function () {
              var _this5$rewarded4;
              return (_this5$rewarded4 = _this5.rewarded) == null ? void 0 : _this5$rewarded4.acknowledgeGrant();
            });
          } else if (view.phase === 'ERROR') {
            if (view.retrySettle) this.button('reward-retry', '重试领取', 185, 610, 380, 96, function () {
              var _this5$rewarded5;
              return void ((_this5$rewarded5 = _this5.rewarded) == null ? void 0 : _this5$rewarded5.retrySettlement());
            });else if (view.pendingAttempt) this.button('reward-abandon', '放弃未确认奖励', 185, 610, 380, 96, function () {
              var _this5$rewarded6;
              return void ((_this5$rewarded6 = _this5.rewarded) == null ? void 0 : _this5$rewarded6.abandonPending());
            });
            this.button('reward-back', '返回游戏', 185, 470, 380, 96, function () {
              var _this5$rewarded7;
              return (_this5$rewarded7 = _this5.rewarded) == null ? void 0 : _this5$rewarded7.closeOffer();
            });
          }
          if (view.simulated) this.text('reward-mock', 'Debug 模拟广告：不会展示真实视频', 375, 370, 20, new Color(170, 70, 40));
        };
        _proto.renderRevive = function renderRevive() {
          var _this$labels$get,
            _this6 = this,
            _view$message2;
          var view = this.reviveView();
          this.themePanel('ui_panel_modal', 375, 667, 660, 900, true);
          this.text('revive-title', '小料洒出来了', 375, 1010, 44, new Color(103, 58, 32));
          var copy = '分数与进度保留。完整观看激励视频可复活本局一次。\n复活时会清理洒出的小料和杯口危险区，\n成功后 2 秒内不会落新料。';
          this.text('revive-copy', copy, 375, 900, 23);
          (_this$labels$get = this.labels.get('revive-copy')) == null || (_this$labels$get = _this$labels$get.node.getComponent(UITransform)) == null || _this$labels$get.setContentSize(560, 150);
          if (!view) {
            this.text('revive-status', '复活组件尚未就绪', 375, 790, 22);
            this.button('revive-end', '结束本局', 185, 540, 380, 96, function () {
              return _this6.declineSpillRevive();
            });
            return;
          }
          var status = view.phase === 'GRANTED' ? '复活成功：分数已保留，点击继续。' : view.phase === 'PREPARING' ? '正在准备激励视频…' : view.phase === 'SHOWING' ? '广告播放中…' : view.phase === 'SETTLING' ? '正在保存复活结果…' : view.phase === 'ERROR' ? (_view$message2 = view.message) != null ? _view$message2 : '复活流程未完成' : view.block === null ? '本局可复活一次；完整观看后才发放。' : this.reviveBlockText(view.block);
          this.text('revive-status', status, 375, 790, 22);
          if (view.phase === 'GRANTED') {
            this.button('revive-continue', '继续游戏', 185, 560, 380, 96, function () {
              var _this6$spillRevive;
              return (_this6$spillRevive = _this6.spillRevive) == null ? void 0 : _this6$spillRevive.acknowledgeGrant();
            });
            return;
          }
          if (view.phase === 'PREPARING' || view.phase === 'SHOWING' || view.phase === 'SETTLING') return;
          if (view.phase === 'ERROR') {
            if (view.retrySettle) this.button('revive-retry', '重试领取', 185, 620, 380, 96, function () {
              var _this6$spillRevive2;
              return void ((_this6$spillRevive2 = _this6.spillRevive) == null ? void 0 : _this6$spillRevive2.retrySettlement());
            });else if (view.pendingAttempt) this.button('revive-abandon', '放弃未确认奖励', 185, 620, 380, 96, function () {
              var _this6$spillRevive3;
              return void ((_this6$spillRevive3 = _this6.spillRevive) == null ? void 0 : _this6$spillRevive3.abandonPending());
            });
            this.button('revive-end', '结束本局', 185, 490, 380, 96, function () {
              var _this6$spillRevive4;
              return (_this6$spillRevive4 = _this6.spillRevive) == null ? void 0 : _this6$spillRevive4.closeOffer();
            });
          } else if (view.pendingAttempt) {
            this.text('revive-status', '上次复活广告未得到可信完成确认，未发放。', 375, 790, 22);
            this.button('revive-abandon', '放弃并结算', 185, 560, 380, 96, function () {
              var _this6$spillRevive5;
              return void ((_this6$spillRevive5 = _this6.spillRevive) == null ? void 0 : _this6$spillRevive5.abandonPending());
            });
          } else if (view.block === null) {
            this.button('revive-watch', '观看广告复活', 185, 620, 380, 96, function () {
              var _this6$spillRevive6, _this6$spillRevive7;
              (_this6$spillRevive6 = _this6.spillRevive) == null || _this6$spillRevive6.openOffer();
              void ((_this6$spillRevive7 = _this6.spillRevive) == null ? void 0 : _this6$spillRevive7.watch());
            });
            this.button('revive-end', '结束本局（正常结算）', 185, 490, 380, 96, function () {
              var _this6$spillRevive8;
              return (_this6$spillRevive8 = _this6.spillRevive) == null ? void 0 : _this6$spillRevive8.closeOffer();
            });
          } else {
            this.button('revive-end', '结束本局', 185, 520, 380, 96, function () {
              var _this6$spillRevive9;
              return (_this6$spillRevive9 = _this6.spillRevive) == null ? void 0 : _this6$spillRevive9.closeOffer();
            });
          }
          if (view.simulated) this.text('revive-mock', 'Debug 模拟广告：不会展示真实视频', 375, 340, 20, new Color(170, 70, 40));
        };
        _proto.reviveBlockText = function reviveBlockText(block) {
          switch (block) {
            case 'POLICY_DISABLED':
              return '洒出复活广告尚未开启';
            case 'AD_UNCONFIGURED':
              return '未配置真实复活广告位';
            case 'AD_UNSUPPORTED':
              return '当前环境不支持激励广告';
            case 'NO_ACTIVE_RUN':
            case 'NOT_SPILL_PENDING':
              return '当前没有可复活的洒出局';
            case 'RUN_LIMIT':
              return '本局已使用过复活';
            case 'DAILY_LIMIT':
              return '今日复活次数已达上限';
            case 'TUTORIAL_REQUIRED':
              return '完成教程后可观看复活广告';
            case 'FIRST_RUN_REQUIRED':
              return '完成一局真实游戏后可观看复活广告';
            case 'FOREGROUND_REQUIRED':
              return '游戏时间稍短，暂不可观看复活广告';
            case 'PENDING_ATTEMPT':
              return '有未确认的复活奖励';
            default:
              return '暂不可复活';
          }
        };
        _proto.startNew = /*#__PURE__*/function () {
          var _startNew = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee4(memoryOnly, seedOverride, attemptId) {
            var _this7 = this;
            var owner, _this$bundle$profile$, _this$bundle$profile$2, rules, runId, seed, adapter, engine, host, snap, pendingReward, pendingRevive, next, repository, _this$bundle$run$runI, _this$bundle$run, _committed$data$warni, committed, _this$world;
            return _regeneratorRuntime().wrap(function _callee4$(_context4) {
              while (1) switch (_context4.prev = _context4.next) {
                case 0:
                  if (memoryOnly === void 0) {
                    memoryOnly = false;
                  }
                case 1:
                  if (!this.saveInFlight) {
                    _context4.next = 6;
                    break;
                  }
                  _context4.next = 4;
                  return this.waitForSaveIdle();
                case 4:
                  _context4.next = 1;
                  break;
                case 6:
                  if (!(this.loading || this.screen === 'PLAYING')) {
                    _context4.next = 8;
                    break;
                  }
                  return _context4.abrupt("return");
                case 8:
                  this.loading = true;
                  this.notice = '正在建立新局…';
                  this.render();
                  owner = ++this.ownerEpoch;
                  _context4.prev = 12;
                  if (this.artReady) {
                    _context4.next = 15;
                    break;
                  }
                  throw new Error('美术资源尚未就绪');
                case 15:
                  _context4.next = 17;
                  return this.loadGameArt();
                case 17:
                  if (!(!this.isOwner() || owner !== this.ownerEpoch)) {
                    _context4.next = 19;
                    break;
                  }
                  return _context4.abrupt("return");
                case 19:
                  rules = AppRuntime.rules;
                  this.runBestScoreAtStart = (_this$bundle$profile$ = (_this$bundle$profile$2 = this.bundle.profile.bestScoresByRules) == null || (_this$bundle$profile$2 = _this$bundle$profile$2[rules.design_rules_version]) == null || (_this$bundle$profile$2 = _this$bundle$profile$2.classic) == null ? void 0 : _this$bundle$profile$2.standard) != null ? _this$bundle$profile$ : 0;
                  runId = this.makeUuid();
                  seed = seedOverride != null ? seedOverride : this.seed();
                  if (attemptId) this.diagnosticAttemptId = attemptId;
                  adapter = this.createWorld();
                  engine = new RunEngine(adapter, rules, runId, seed, undefined, this.reviveOptions());
                  engine.setTimingDiagnostics(this.probeMode() !== 'off');
                  this.adapter = adapter;
                  this.engine = engine;
                  this.baseTick = 0;
                  this.lastEvents = [];
                  this.events.clear();
                  this.commands.clear();
                  this.consumedDomainEventIds.clear();
                  this.lastConsumedDomainEvent = null;
                  this.resultSaved = false;
                  this.resultError = '';
                  this.screen = 'PLAYING';
                  this.tutorialStep = this.bundle.profile.tutorialRulesVersion === rules.design_rules_version ? 0 : 1;
                  this.tutorialReturnScreen = 'PLAYING';
                  this.pauseOwners.clear();
                  host = HostLifecycleCoordinator.snapshot();
                  if (host.resumeRequired) this.pauseOwners.add('RESUME_REQUIRED');
                  if (host.backgrounded) this.pauseOwners.add('HOST_HIDDEN');
                  if (this.tutorialStep) {
                    engine.pause('MODAL');
                    this.pauseOwners.add('MODAL');
                  }
                  snap = engine.snapshot();
                  pendingReward = this.bundle.profile.rewardedShake.pendingAttempt;
                  pendingRevive = this.bundle.profile.rewardedRevive.pendingAttempt;
                  next = _extends({}, this.bundle, {
                    profile: _extends({}, this.bundle.profile, {
                      activeRunId: runId,
                      revision: this.bundle.profile.revision + 1,
                      rewardedShake: pendingReward && pendingReward.runId !== runId ? RewardLedger.clearPending(this.bundle.profile.rewardedShake) : this.bundle.profile.rewardedShake,
                      rewardedRevive: pendingRevive && pendingRevive.runId !== runId ? ReviveLedger.clearPending(this.bundle.profile.rewardedRevive) : this.bundle.profile.rewardedRevive
                    }),
                    run: snap,
                    lastResult: null
                  });
                  repository = this.activeSaveRepository();
                  if (!(!memoryOnly && repository && this.persistent)) {
                    _context4.next = 71;
                    break;
                  }
                  _context4.next = 53;
                  return repository.commitBundle(this.bundleRevision, (_this$bundle$run$runI = (_this$bundle$run = this.bundle.run) == null ? void 0 : _this$bundle$run.runId) != null ? _this$bundle$run$runI : null, next);
                case 53:
                  committed = _context4.sent;
                  if (committed.ok) {
                    _context4.next = 66;
                    break;
                  }
                  engine.dispose();
                  this.engine = null;
                  this.adapter = null;
                  (_this$world = this.world) == null || _this$world.destroy();
                  this.world = null;
                  this.clock = null;
                  this.screen = 'ERROR';
                  this.notice = "\u65B0\u5C40\u5B58\u6863\u5931\u8D25\uFF1A" + committed.error.message + "\u3002\u53EF\u91CD\u8BD5\u6216\u660E\u786E\u9009\u62E9\u4EC5\u5185\u5B58\u65B0\u5C40\u3002";
                  this.resultError = this.notice;
                  this.render();
                  return _context4.abrupt("return");
                case 66:
                  this.bundleRevision = committed.data.revision;
                  this.bundle = next;
                  this.notice = (_committed$data$warni = committed.data.warning) != null ? _committed$data$warni : '';
                  _context4.next = 74;
                  break;
                case 71:
                  this.bundle = next;
                  if (!this.debugMode) this.persistent = false;
                  this.notice = this.debugMode ? '' : '仅内存模式：此局不会跨关闭页面保存。';
                case 74:
                  if (!(!this.isOwner() || owner !== this.ownerEpoch)) {
                    _context4.next = 76;
                    break;
                  }
                  return _context4.abrupt("return");
                case 76:
                  this.clock = new FixedClock(rules.physics.fixed_hz, rules.physics.max_catchup_steps, function () {
                    return _this7.advanceRunTick();
                  });
                  if (this.pauseOwners.size) {
                    if (!this.pauseOwners.has('MODAL')) {
                      this.engine.pause(this.pauseOwners.has('HOST_HIDDEN') ? 'HOST_HIDDEN' : 'RESUME_REQUIRED');
                      this.screen = 'PAUSED';
                    }
                    this.clock.pause();
                  }
                  this.previewX = rules.cup.center_x_du;
                  this.lastSaveTick = 0;
                  this.resultFinalized = false;
                  this.resultSaved = false;
                  this.resultError = '';
                  this.saveDirty = true;
                  this.bindRewardedShake();
                  this.bindSpillRevive();
                  this.render();
                  _context4.next = 92;
                  break;
                case 89:
                  _context4.prev = 89;
                  _context4.t0 = _context4["catch"](12);
                  if (this.isOwner() && owner === this.ownerEpoch) {
                    this.enterTechnicalError(String(_context4.t0));
                  }
                case 92:
                  _context4.prev = 92;
                  if (this.isOwner() && owner === this.ownerEpoch) this.loading = false;
                  return _context4.finish(92);
                case 95:
                case "end":
                  return _context4.stop();
              }
            }, _callee4, this, [[12, 89, 92, 95]]);
          }));
          function startNew(_x, _x2, _x3) {
            return _startNew.apply(this, arguments);
          }
          return startNew;
        }();
        _proto.createWorld = function createWorld() {
          var _this$world2;
          if ((_this$world2 = this.world) != null && _this$world2.isValid) this.world.destroy();
          this.ingredientViews.clear();
          this.shakeArcNodes = [];
          this.contactPairs.clear();
          this.contactObjectTicks.clear();
          this.lastContactFeedbackTick = -60;
          this.world = new Node('P1BPhysicsWorld');
          this.node.addChild(this.world);
          this.world.setSiblingIndex(Math.max(0, this.node.children.length - 2));
          this.worldId = GameRoot.nextWorldId++;
          var rules = AppRuntime.rules;
          var adapter = new CocosPhysicsAdapter(this.world, rules, AppRuntime.mapper);
          adapter.setTimingDiagnostics(this.probeMode() !== 'off');
          adapter.createCup('classic');
          this.createCupArt();
          return adapter;
        };
        _proto.createCupArt = function createCupArt() {
          var _this$rear, _this$front, _this$fixedBackground, _this$uiRoot;
          var rules = AppRuntime.rules;
          if ((_this$rear = this.rear) != null && _this$rear.isValid) this.rear.destroy();
          if ((_this$front = this.front) != null && _this$front.isValid) this.front.destroy();
          this.rear = new Node('CupRearArt');
          this.node.addChild(this.rear);
          this.rear.setSiblingIndex(Math.max(0, this.node.children.length - 3));
          this.front = new Node('CupFrontArt');
          this.node.addChild(this.front);
          this.front.setSiblingIndex(Math.max(0, this.node.children.length - 2));
          if ((_this$fixedBackground = this.fixedBackground) != null && _this$fixedBackground.isValid) this.fixedBackground.destroy();
          this.fixedBackground = this.art.createSprite(this.node, 'bg_shop_base', rules.viewport.width_du, rules.viewport.height_du, true);
          this.fixedBackground.name = 'FixedShopBackground';
          this.fixedBackground.setPosition(0, 0, -10);
          this.fixedBackground.setSiblingIndex(0);
          this.coverBackground(this.fixedBackground, 'bg_shop_base');
          var shadow = this.art.createSprite(this.rear, 'spr_cup_shadow', 512, 128);
          shadow.setPosition(0, this.localY(rules.cup.inner_bottom_y_du - 30), 0);
          // The 1000-DU source layers are mapped only along Y: y' = 360 + (y - 260) * 0.8.
          // This aligns the existing transparent cup art to the new 360..1000 DU physical bowl.
          for (var _i2 = 0, _arr2 = ['back', 'tea', 'rim_back']; _i2 < _arr2.length; _i2++) {
            var _variant$display_size;
            var suffix = _arr2[_i2];
            var id = "spr_cup_classic_" + suffix,
              variant = this.art.catalog.select(id, 1000),
              size = (_variant$display_size = variant.display_size) != null ? _variant$display_size : variant.size;
            var n = this.art.createSprite(this.rear, id, size[0], size[1]);
            n.setPosition(-size[0] / 2, this.localY(312), 0);
            n.setScale(1, 0.8, 1);
          }
          for (var _i3 = 0, _arr3 = ['front', 'rim_front', 'base', 'label']; _i3 < _arr3.length; _i3++) {
            var _variant$display_size2;
            var _suffix = _arr3[_i3];
            var _id = "spr_cup_classic_" + _suffix,
              _variant = this.art.catalog.select(_id, 1000),
              _size = (_variant$display_size2 = _variant.display_size) != null ? _variant$display_size2 : _variant.size;
            var _n = this.art.createSprite(this.front, _id, _size[0], _size[1]);
            _n.setPosition(-_size[0] / 2, this.localY(312), 0);
            _n.setScale(1, 0.8, 1);
          }
          for (var _i4 = 0, _arr4 = [-1, 1]; _i4 < _arr4.length; _i4++) {
            var side = _arr4[_i4];
            for (var index = 0; index < 2; index++) {
              var node = new Node("CupShakeArc-" + side + "-" + index);
              this.front.addChild(node);
              node.setPosition(side * (245 + index * 18), this.localY(875), 2);
              var opacity = node.addComponent(UIOpacity);
              opacity.opacity = 0;
              var graphics = node.addComponent(Graphics);
              graphics.lineWidth = 5;
              graphics.strokeColor = new Color(255, 232, 192, 230);
              graphics.arc(0, 0, 16 + index * 7, side < 0 ? 0.25 : Math.PI + 0.25, side < 0 ? 2.9 : Math.PI + 2.9, false);
              graphics.stroke();
              this.shakeArcNodes.push({
                node: node,
                opacity: opacity
              });
            }
          }
          // Audio nodes are siblings too; keep the full-screen cup art below the player HUD.
          if ((_this$uiRoot = this.uiRoot) != null && _this$uiRoot.isValid) this.uiRoot.setSiblingIndex(this.node.children.length - 1);
        };
        _proto.syncCupArt = function syncCupArt() {
          var _engine$presentationC, _engine$presentationT, _engine$presentationS, _this$rear2, _this$front2;
          var engine = this.engine;
          var offset = (_engine$presentationC = engine == null ? void 0 : engine.presentationCupOffsetXDu) != null ? _engine$presentationC : 0;
          var tick = (_engine$presentationT = engine == null ? void 0 : engine.presentationTick) != null ? _engine$presentationT : 0;
          var start = (_engine$presentationS = engine == null ? void 0 : engine.presentationShakeStartTick) != null ? _engine$presentationS : null;
          var rules = AppRuntime.rules;
          var visual = 0;
          if (start !== null && rules) {
            var _elapsed = Math.max(0, (tick - start) / rules.physics.fixed_hz);
            var duration = rules.shake.duration_seconds;
            if (_elapsed < duration) {
              var amp = this.reducedMotion ? Math.min(2, rules.shake.visual_offset_max_du) : rules.shake.visual_offset_max_du;
              visual = amp * Math.pow(Math.sin(Math.PI * _elapsed / duration), 2) * Math.sin(2 * Math.PI * rules.shake.frequency_hz * _elapsed);
            }
          }
          var x = offset + visual;
          if ((_this$rear2 = this.rear) != null && _this$rear2.isValid) this.rear.setPosition(x, 0, 0);
          if ((_this$front2 = this.front) != null && _this$front2.isValid) this.front.setPosition(x, 0, 0);
          var elapsed = start === null || !rules ? -1 : (tick - start) / rules.physics.fixed_hz;
          var alpha = 0;
          if (rules && elapsed >= 0 && elapsed < rules.shake.duration_seconds) {
            alpha = Math.min(1, elapsed / 0.1, (rules.shake.duration_seconds - elapsed) / 0.15);
            if (this.reducedMotion) alpha = Math.min(0.55, alpha);
          }
          for (var _iterator = _createForOfIteratorHelperLoose(this.shakeArcNodes), _step; !(_step = _iterator()).done;) {
            var arc = _step.value;
            if (arc.node.isValid) arc.opacity.opacity = Math.max(0, Math.round(alpha * 255));
          }
        };
        _proto.localY = function localY(worldY) {
          return worldY - AppRuntime.rules.viewport.height_du / 2;
        };
        _proto.syncViews = function syncViews(states) {
          var _this$world3,
            _this8 = this;
          if (!states || !this.adapter || !((_this$world3 = this.world) != null && _this$world3.isValid)) return;
          var live = new Set(states.map(function (s) {
            return s.entityId;
          }));
          for (var _iterator2 = _createForOfIteratorHelperLoose(this.ingredientViews), _step2; !(_step2 = _iterator2()).done;) {
            var _step2$value = _step2.value,
              id = _step2$value[0],
              node = _step2$value[1];
            if (!live.has(id) || !node.isValid) {
              if (node.isValid) node.destroy();
              this.ingredientViews["delete"](id);
            }
          }
          var _loop = function _loop() {
            var _n2;
            var state = _step3.value;
            var n = _this8.ingredientViews.get(state.entityId);
            if (!((_n2 = n) != null && _n2.isValid)) {
              var item = AppRuntime.rules.ingredients.find(function (v) {
                return v.level === state.level;
              });
              n = _this8.art.createSprite(_this8.world, ArtCatalog.ingredientId(item.id), ArtCatalog.ingredientEdgeDu(item.radius_du), ArtCatalog.ingredientEdgeDu(item.radius_du), true);
              n.name = "P1BIngredientVisual-" + state.entityId;
              _this8.ingredientViews.set(state.entityId, n);
            }
            n.setPosition(state.positionDu.x - AppRuntime.rules.viewport.width_du / 2, state.positionDu.y - AppRuntime.rules.viewport.height_du / 2, 0);
            n.angle = state.angleRadians * 180 / Math.PI;
          };
          for (var _iterator3 = _createForOfIteratorHelperLoose(states), _step3; !(_step3 = _iterator3()).done;) {
            _loop();
          }
        };
        _proto.processEvents = function processEvents() {
          if (!this.lastEvents.length) return;
          for (var _iterator4 = _createForOfIteratorHelperLoose(this.lastEvents), _step4; !(_step4 = _iterator4()).done;) {
            var _this$audio4, _this$audio5;
            var event = _step4.value;
            if (this.consumedDomainEventIds.has(event.eventId)) continue;
            this.consumedDomainEventIds.add(event.eventId);
            this.lastConsumedDomainEvent = event;
            if (this.consumedDomainEventIds.size > 4096) this.consumedDomainEventIds["delete"](this.consumedDomainEventIds.values().next().value);
            if (this.probeMode() === 'full') this.events.append(event);
            if (event.kind === 'IngredientDropped' || event.kind === 'MergeCommitted' || event.kind === 'ShakeConsumed') this.saveDirty = true;
            if (event.kind === 'IngredientDropped') (_this$audio4 = this.audio) == null || _this$audio4.play('drop');
            if (event.kind === 'MergeCommitted') {
              var _this$effects4, _this$effects5;
              this.showMergeFeedback(event.positionDu, event.scoreDelta);
              void ((_this$effects4 = this.effects) == null ? void 0 : _this$effects4.play('merge', event.positionDu.x, event.positionDu.y, event.eventId, this.reducedMotion));
              void ((_this$effects5 = this.effects) == null ? void 0 : _this$effects5.play('combo', event.positionDu.x, event.positionDu.y + 72, event.eventId, this.reducedMotion));
            }
            if (event.kind === 'MergeCommitted') (_this$audio5 = this.audio) == null || _this$audio5.play(event.childLevel <= 4 ? 'merge_small' : 'merge_large');
            if (event.kind === 'ShakeConsumed') {
              var _this$effects6, _this$audio6;
              this.showTextFeedback('轻晃', 375, 1015, new Color(247, 192, 115));
              void ((_this$effects6 = this.effects) == null ? void 0 : _this$effects6.play('tap', 375, 1015, event.eventId, this.reducedMotion));
              (_this$audio6 = this.audio) == null || _this$audio6.play('shake_start');
            }
            if (event.kind === 'DangerChanged' && event.dangerTicks > 0 && event.tick - this.lastDangerCueTick >= 60) {
              var _this$effects7, _this$audio7;
              this.lastDangerCueTick = event.tick;
              void ((_this$effects7 = this.effects) == null ? void 0 : _this$effects7.play('danger', 375, 740, event.eventId, true));
              (_this$audio7 = this.audio) == null || _this$audio7.play('danger_tick');
            }
            if (event.kind === 'SpillReviveOffered') {
              var _this$audio8, _this$effects8;
              (_this$audio8 = this.audio) == null || _this$audio8.play('result');
              void ((_this$effects8 = this.effects) == null ? void 0 : _this$effects8.play('result', 375, 805, event.eventId, this.reducedMotion));
              this.enterSpillOffer();
            }
            if (event.kind === 'RunEnded') {
              var _this$audio9, _this$effects9, _this$clock6;
              (_this$audio9 = this.audio) == null || _this$audio9.play('result');
              void ((_this$effects9 = this.effects) == null ? void 0 : _this$effects9.play('result', 375, 805, event.eventId, this.reducedMotion));
              this.screen = 'RESULTS';
              (_this$clock6 = this.clock) == null || _this$clock6.pause();
              this.resultSaved = false;
              this.resultFinalized = false;
            }
          }
          this.lastEvents.length = 0;
        };
        _proto.waitForSaveIdle = /*#__PURE__*/function () {
          var _waitForSaveIdle = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee5() {
            var _this9 = this;
            return _regeneratorRuntime().wrap(function _callee5$(_context5) {
              while (1) switch (_context5.prev = _context5.next) {
                case 0:
                  if (this.saveInFlight) {
                    _context5.next = 2;
                    break;
                  }
                  return _context5.abrupt("return");
                case 2:
                  _context5.next = 4;
                  return new Promise(function (resolve) {
                    return _this9.saveIdleWaiters.push(resolve);
                  });
                case 4:
                case "end":
                  return _context5.stop();
              }
            }, _callee5, this);
          }));
          function waitForSaveIdle() {
            return _waitForSaveIdle.apply(this, arguments);
          }
          return waitForSaveIdle;
        }();
        _proto.activeSaveRepository = function activeSaveRepository() {
          return this.debugMode ? this.debugRepo : this.persistent ? this.repo : null;
        }
        /** Ad services follow the active save repository so debug fixtures persist receipts in their own namespace. */;
        _proto.adSaveRepository = function adSaveRepository() {
          var _this10 = this;
          var pick = function pick() {
            var _this10$activeSaveRep;
            return (_this10$activeSaveRep = _this10.activeSaveRepository()) != null ? _this10$activeSaveRep : _this10.repo;
          };
          return {
            readBundle: function readBundle() {
              return pick().readBundle();
            },
            commitBundle: function commitBundle(expectedRevision, expectedRunId, next) {
              return pick().commitBundle(expectedRevision, expectedRunId, next);
            },
            acquireWriteLease: function acquireWriteLease() {
              return pick().acquireWriteLease();
            }
          };
        };
        _proto.beginSaveTask = function beginSaveTask() {
          if (this.activeSaveTaskId !== 0) return null;
          var id = ++this.saveTaskSequence;
          this.activeSaveTaskId = id;
          this.saveInFlight = true;
          return id;
        };
        _proto.ownsSaveTask = function ownsSaveTask(id, owner) {
          return this.activeSaveTaskId === id && owner === this.ownerEpoch && this.isOwner();
        };
        _proto.finishSaveTask = function finishSaveTask(id) {
          var _this$engine10;
          if (this.activeSaveTaskId !== id) return;
          this.activeSaveTaskId = 0;
          this.saveInFlight = false;
          var waiters = this.saveIdleWaiters.splice(0);
          for (var _iterator5 = _createForOfIteratorHelperLoose(waiters), _step5; !(_step5 = _iterator5()).done;) {
            var resolve = _step5.value;
            resolve();
          }
          if (!this.isOwner()) return;
          if (((_this$engine10 = this.engine) == null ? void 0 : _this$engine10.phase) === 'SETTLING') {
            if (!this.resultFinalized) void this.commitResult();else this.saveDirty = false;
            return;
          }
          if (this.settingsDirty && this.activeSaveRepository()) {
            this.settingsDirty = false;
            void this.persistSettings();
            return;
          }
          if (this.saveDirty && this.activeSaveRepository() && this.engine) {
            void this.commitCheckpoint(true);
          }
        };
        _proto.commitCheckpoint = /*#__PURE__*/function () {
          var _commitCheckpoint = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee6(immediate) {
            var _this$bundle$run$runI2, _this$bundle$run2;
            var repository, task, owner, runId, expectedRevision, expectedRunId, measureSave, start, _this$bundle$profile$3, _this$bundle$profile$4, _this$bundle$profile$5, _this$bundle$profile$6, _extends2, _extends3, _this$engine11, snap, score, rulesVersion, bucket, best, profile, next, result, _this$clock7;
            return _regeneratorRuntime().wrap(function _callee6$(_context6) {
              while (1) switch (_context6.prev = _context6.next) {
                case 0:
                  repository = this.activeSaveRepository();
                  if (!(!this.engine || !repository)) {
                    _context6.next = 4;
                    break;
                  }
                  this.saveDirty = false;
                  return _context6.abrupt("return");
                case 4:
                  if (!this.saveInFlight) {
                    _context6.next = 7;
                    break;
                  }
                  this.saveDirty = true;
                  return _context6.abrupt("return");
                case 7:
                  task = this.beginSaveTask();
                  if (!(task === null)) {
                    _context6.next = 11;
                    break;
                  }
                  this.saveDirty = true;
                  return _context6.abrupt("return");
                case 11:
                  this.saveDirty = false;
                  owner = this.ownerEpoch;
                  runId = this.engine.snapshot().runId;
                  expectedRevision = this.bundleRevision;
                  expectedRunId = (_this$bundle$run$runI2 = (_this$bundle$run2 = this.bundle.run) == null ? void 0 : _this$bundle$run2.runId) != null ? _this$bundle$run$runI2 : null;
                  measureSave = this.probeMode() !== 'off';
                  start = measureSave ? performance.now() : 0;
                  _context6.prev = 18;
                  snap = SaveCodec.sealSnapshot(this.engine.snapshot());
                  score = snap.score;
                  rulesVersion = snap.rulesVersion;
                  bucket = snap.boardType === 'assisted' ? 'assisted' : 'standard';
                  best = (_this$bundle$profile$3 = (_this$bundle$profile$4 = this.bundle.profile.bestScoresByRules) == null || (_this$bundle$profile$4 = _this$bundle$profile$4[rulesVersion]) == null || (_this$bundle$profile$4 = _this$bundle$profile$4.classic) == null ? void 0 : _this$bundle$profile$4[bucket]) != null ? _this$bundle$profile$3 : 0;
                  profile = _extends({}, this.bundle.profile, {
                    activeRunId: snap.runId,
                    discoveredLevels: Array.from(new Set([].concat(this.bundle.profile.discoveredLevels, snap.ingredients.map(function (i) {
                      return i.level;
                    })))).sort(),
                    bestScoresByRules: _extends({}, this.bundle.profile.bestScoresByRules, (_extends3 = {}, _extends3[rulesVersion] = _extends({}, (_this$bundle$profile$5 = this.bundle.profile.bestScoresByRules) == null ? void 0 : _this$bundle$profile$5[rulesVersion], {
                      classic: _extends({}, (_this$bundle$profile$6 = this.bundle.profile.bestScoresByRules) == null || (_this$bundle$profile$6 = _this$bundle$profile$6[rulesVersion]) == null ? void 0 : _this$bundle$profile$6.classic, (_extends2 = {}, _extends2[bucket] = Math.max(best, score), _extends2))
                    }), _extends3)),
                    revision: this.bundle.profile.revision + 1
                  });
                  next = _extends({}, this.bundle, {
                    profile: profile,
                    run: snap
                  });
                  _context6.next = 28;
                  return repository.commitBundle(expectedRevision, expectedRunId, next);
                case 28:
                  result = _context6.sent;
                  if (!(!this.ownsSaveTask(task, owner) || ((_this$engine11 = this.engine) == null ? void 0 : _this$engine11.snapshot().runId) !== runId)) {
                    _context6.next = 31;
                    break;
                  }
                  return _context6.abrupt("return");
                case 31:
                  if (result.ok) {
                    this.bundle = next;
                    this.bundleRevision = result.data.revision;
                    if (result.data.warning) this.notice = result.data.warning;
                    this.lastSaveTick = snap.tick;
                  } else {
                    this.saveDirty = false;
                    this.notice = "\u4FDD\u5B58\u672A\u5B8C\u6210\uFF1A" + result.error.message;
                    if (result.error.code === 'CONFLICT_REVISION') {
                      this.engine.pause('TECHNICAL_ERROR');
                      (_this$clock7 = this.clock) == null || _this$clock7.pause();
                      this.pauseOwners.add('TECHNICAL_ERROR');
                      this.cancelPointer();
                      this.screen = 'PAUSED';
                      this.notice = '存档版本冲突；为保护现有存档，本局已冻结。请重新开始或重新加载。';
                    }
                  }
                  _context6.next = 37;
                  break;
                case 34:
                  _context6.prev = 34;
                  _context6.t0 = _context6["catch"](18);
                  if (this.ownsSaveTask(task, owner)) {
                    this.saveDirty = true;
                    this.notice = "\u4FDD\u5B58\u5931\u8D25\uFF1A" + String(_context6.t0);
                  }
                case 37:
                  _context6.prev = 37;
                  if (this.ownsSaveTask(task, owner)) {
                    if (measureSave) this.timingSaveMs = performance.now() - start;
                    if (this.screen !== 'PLAYING') this.render();
                  }
                  this.finishSaveTask(task);
                  return _context6.finish(37);
                case 41:
                case "end":
                  return _context6.stop();
              }
            }, _callee6, this, [[18, 34, 37, 41]]);
          }));
          function commitCheckpoint(_x4) {
            return _commitCheckpoint.apply(this, arguments);
          }
          return commitCheckpoint;
        }();
        _proto.commitResult = /*#__PURE__*/function () {
          var _commitResult = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee7() {
            var _this$clock8, _snap$terminalReason, _this$bundle$profile$7, _this$bundle$profile$8, _this$bundle$profile$9, _this$bundle$profile$10, _extends4, _extends5;
            var task, owner, runId, snap, reason, rulesVersion, bucket, pending, pendingRevive, profile, next, _this$engine13, repository, _this$bundle$run$runI3, _this$bundle$run3, _this$engine12, result;
            return _regeneratorRuntime().wrap(function _callee7$(_context7) {
              while (1) switch (_context7.prev = _context7.next) {
                case 0:
                  if (!(!this.engine || this.saveInFlight || this.resultFinalized)) {
                    _context7.next = 2;
                    break;
                  }
                  return _context7.abrupt("return");
                case 2:
                  task = this.beginSaveTask();
                  if (!(task === null)) {
                    _context7.next = 5;
                    break;
                  }
                  return _context7.abrupt("return");
                case 5:
                  owner = this.ownerEpoch;
                  runId = this.engine.snapshot().runId;
                  this.screen = 'RESULTS';
                  (_this$clock8 = this.clock) == null || _this$clock8.pause();
                  this.render();
                  snap = SaveCodec.sealSnapshot(this.engine.snapshot());
                  reason = (_snap$terminalReason = snap.terminalReason) != null ? _snap$terminalReason : 'ABANDONED';
                  rulesVersion = snap.rulesVersion;
                  bucket = snap.boardType === 'assisted' ? 'assisted' : 'standard';
                  pending = this.bundle.profile.rewardedShake.pendingAttempt;
                  pendingRevive = this.bundle.profile.rewardedRevive.pendingAttempt;
                  profile = _extends({}, this.bundle.profile, {
                    activeRunId: null,
                    revision: this.bundle.profile.revision + 1,
                    firstNaturalRunCompleted: this.bundle.profile.firstNaturalRunCompleted || snap.boardType === 'standard' && (reason === 'CUP_FULL' || reason === 'SPILLED'),
                    rewardedShake: pending && pending.runId === snap.runId ? RewardLedger.clearPending(this.bundle.profile.rewardedShake) : this.bundle.profile.rewardedShake,
                    rewardedRevive: pendingRevive && pendingRevive.runId === snap.runId ? ReviveLedger.clearPending(this.bundle.profile.rewardedRevive) : this.bundle.profile.rewardedRevive,
                    bestScoresByRules: _extends({}, this.bundle.profile.bestScoresByRules, (_extends5 = {}, _extends5[rulesVersion] = _extends({}, (_this$bundle$profile$7 = this.bundle.profile.bestScoresByRules) == null ? void 0 : _this$bundle$profile$7[rulesVersion], {
                      classic: _extends({}, (_this$bundle$profile$8 = this.bundle.profile.bestScoresByRules) == null || (_this$bundle$profile$8 = _this$bundle$profile$8[rulesVersion]) == null ? void 0 : _this$bundle$profile$8.classic, (_extends4 = {}, _extends4[bucket] = Math.max((_this$bundle$profile$9 = (_this$bundle$profile$10 = this.bundle.profile.bestScoresByRules) == null || (_this$bundle$profile$10 = _this$bundle$profile$10[rulesVersion]) == null || (_this$bundle$profile$10 = _this$bundle$profile$10.classic) == null ? void 0 : _this$bundle$profile$10[bucket]) != null ? _this$bundle$profile$9 : 0, snap.score), _extends4))
                    }), _extends5))
                  });
                  next = {
                    profile: profile,
                    run: null,
                    lastResult: {
                      runId: snap.runId,
                      reason: reason,
                      score: snap.score,
                      maxLevel: snap.maxLevel,
                      dropIndex: snap.dropIndex,
                      baseUsed: snap.shake.baseUsed,
                      extraUsed: snap.shake.extraUsed,
                      boardType: snap.boardType,
                      rulesVersion: rulesVersion
                    }
                  };
                  _context7.prev = 18;
                  repository = this.activeSaveRepository();
                  if (!repository) {
                    _context7.next = 30;
                    break;
                  }
                  _context7.next = 23;
                  return repository.commitBundle(this.bundleRevision, (_this$bundle$run$runI3 = (_this$bundle$run3 = this.bundle.run) == null ? void 0 : _this$bundle$run3.runId) != null ? _this$bundle$run$runI3 : null, next);
                case 23:
                  result = _context7.sent;
                  if (!(!this.ownsSaveTask(task, owner) || ((_this$engine12 = this.engine) == null ? void 0 : _this$engine12.snapshot().runId) !== runId)) {
                    _context7.next = 26;
                    break;
                  }
                  return _context7.abrupt("return");
                case 26:
                  if (result.ok) {
                    _context7.next = 28;
                    break;
                  }
                  throw new Error(result.error.message);
                case 28:
                  this.bundleRevision = result.data.revision;
                  if (result.data.warning) this.resultError = result.data.warning;
                case 30:
                  if (!(!this.ownsSaveTask(task, owner) || ((_this$engine13 = this.engine) == null ? void 0 : _this$engine13.snapshot().runId) !== runId)) {
                    _context7.next = 32;
                    break;
                  }
                  return _context7.abrupt("return");
                case 32:
                  this.bundle = next;
                  this.resultSaved = !!this.activeSaveRepository();
                  this.resultFinalized = true;
                  this.resultError = this.resultSaved ? this.resultError : '仅内存模式，结果未保存。';
                  _context7.next = 41;
                  break;
                case 38:
                  _context7.prev = 38;
                  _context7.t0 = _context7["catch"](18);
                  if (this.ownsSaveTask(task, owner)) {
                    this.resultError = "\u7ED3\u679C\u5C1A\u672A\u4FDD\u5B58\uFF1A" + String(_context7.t0);
                    this.notice = this.resultError;
                    this.resultFinalized = true;
                  }
                case 41:
                  _context7.prev = 41;
                  if (this.ownsSaveTask(task, owner)) {
                    this.screen = 'RESULTS';
                    this.render();
                  }
                  this.finishSaveTask(task);
                  return _context7.finish(41);
                case 45:
                case "end":
                  return _context7.stop();
              }
            }, _callee7, this, [[18, 38, 41, 45]]);
          }));
          function commitResult() {
            return _commitResult.apply(this, arguments);
          }
          return commitResult;
        }();
        _proto.retryResultSave = /*#__PURE__*/function () {
          var _retryResultSave = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee8() {
            var _this$engine14;
            return _regeneratorRuntime().wrap(function _callee8$(_context8) {
              while (1) switch (_context8.prev = _context8.next) {
                case 0:
                  if (!(((_this$engine14 = this.engine) == null ? void 0 : _this$engine14.phase) === 'SETTLING' && !this.saveInFlight && !this.resultSaved)) {
                    _context8.next = 4;
                    break;
                  }
                  this.resultFinalized = false;
                  _context8.next = 4;
                  return this.commitResult();
                case 4:
                case "end":
                  return _context8.stop();
              }
            }, _callee8, this);
          }));
          function retryResultSave() {
            return _retryResultSave.apply(this, arguments);
          }
          return retryResultSave;
        }();
        _proto.continueRun = /*#__PURE__*/function () {
          var _continueRun = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee9() {
            var _this$engine$lastTick, _this$engine15, _this$engine16, _this$audio10;
            var recoverableFixtureFault, host, ack, resumed;
            return _regeneratorRuntime().wrap(function _callee9$(_context9) {
              while (1) switch (_context9.prev = _context9.next) {
                case 0:
                  recoverableFixtureFault = /FIXTURE_(?:CREATE_CHILD|SECOND_COMMIT)_ONCE/.test((_this$engine$lastTick = (_this$engine15 = this.engine) == null ? void 0 : _this$engine15.lastTickFault) != null ? _this$engine$lastTick : '');
                  if (!((_this$engine16 = this.engine) != null && _this$engine16.lastTickFault && !recoverableFixtureFault)) {
                    _context9.next = 5;
                    break;
                  }
                  this.notice = '本局发生物理事务异常并已冻结。请重新开始；原完整存档边界已保留。';
                  this.render();
                  return _context9.abrupt("return");
                case 5:
                  if (!(this.loading || !this.engine || !this.clock)) {
                    _context9.next = 7;
                    break;
                  }
                  return _context9.abrupt("return");
                case 7:
                  host = HostLifecycleCoordinator.snapshot();
                  if (!(host.backgrounded || this.pauseOwners.has('HOST_HIDDEN'))) {
                    _context9.next = 12;
                    break;
                  }
                  this.notice = '当前仍在后台，不能继续。';
                  this.render();
                  return _context9.abrupt("return");
                case 12:
                  if (!(this.pauseOwners.has('AD') || this.pauseOwners.has('MODAL') || this.pauseOwners.has('TECHNICAL_ERROR') && !recoverableFixtureFault || this.pauseOwners.has('RESTORING'))) {
                    _context9.next = 16;
                    break;
                  }
                  this.notice = '请先关闭弹窗或处理错误后再继续。';
                  this.render();
                  return _context9.abrupt("return");
                case 16:
                  if (recoverableFixtureFault) this.pauseOwners["delete"]('TECHNICAL_ERROR');
                  if (!host.resumeRequired) {
                    _context9.next = 23;
                    break;
                  }
                  ack = HostLifecycleCoordinator.confirmUserResume(host.hideEpoch, true, true, true);
                  if (ack.ok) {
                    _context9.next = 23;
                    break;
                  }
                  this.notice = "\u6682\u65F6\u4E0D\u80FD\u7EE7\u7EED\uFF1A" + ack.reason;
                  this.render();
                  return _context9.abrupt("return");
                case 23:
                  resumed = this.engine.resume();
                  if (resumed.ok) {
                    _context9.next = 28;
                    break;
                  }
                  this.notice = resumed.error.message;
                  this.render();
                  return _context9.abrupt("return");
                case 28:
                  this.pauseOwners.clear();
                  this.clock.resume();
                  (_this$audio10 = this.audio) == null || _this$audio10.resumeAfterUserGesture();
                  this.screen = 'PLAYING';
                  this.notice = '已继续；后台时间不会补算。';
                  this.saveDirty = true;
                  this.render();
                case 35:
                case "end":
                  return _context9.stop();
              }
            }, _callee9, this);
          }));
          function continueRun() {
            return _continueRun.apply(this, arguments);
          }
          return continueRun;
        }();
        _proto.togglePause = function togglePause() {
          if (this.screen === 'PLAYING') {
            var _this$engine17, _this$clock9;
            (_this$engine17 = this.engine) == null || _this$engine17.pause('MANUAL');
            (_this$clock9 = this.clock) == null || _this$clock9.pause();
            this.pauseOwners.add('MANUAL');
            this.cancelPointer();
            this.screen = 'PAUSED';
            this.notice = '已暂停。';
            this.saveDirty = true;
            void this.commitCheckpoint(true);
            this.render();
          } else if (this.screen === 'PAUSED') void this.continueRun();
        };
        _proto.resumeByUser = function resumeByUser() {
          if (this.screen === 'PAUSED') void this.continueRun();
        };
        _proto.isModalScreen = function isModalScreen() {
          return this.screen === 'SETTINGS' || this.screen === 'CONFIRM_RESTART' || this.screen === 'CONFIRM_MENU' || this.screen === 'REWARD' || this.screen === 'REVIVE';
        };
        _proto.openModal = function openModal(screen) {
          var _this11 = this;
          this.cancelPointer();
          if (screen === 'SETTINGS') this.settingsReturnScreen = this.engine ? 'PAUSED' : 'MENU';
          this.pauseOwners.add('MODAL');
          if (this.engine) {
            var _this$clock10;
            this.engine.pause('MODAL');
            (_this$clock10 = this.clock) == null || _this$clock10.pause();
          }
          this.screen = screen;
          this.render();
          if (screen === 'SETTINGS') {
            var owner = this.ownerEpoch;
            void this.loadArtBatch(this.art.catalog.ids.filter(function (id) {
              return id.startsWith('ui_');
            })).then(function () {
              if (_this11.isOwner() && owner === _this11.ownerEpoch && _this11.screen === 'SETTINGS') _this11.render();
            }, function () {
              if (_this11.isOwner() && owner === _this11.ownerEpoch && _this11.screen === 'SETTINGS') {
                _this11.notice = '部分设置图片加载失败，文字控件仍可操作。';
                _this11.render();
              }
            });
          }
        };
        _proto.closeModal = function closeModal() {
          this.pauseOwners["delete"]('MODAL');
          this.cancelPointer();
          this.screen = this.screen === 'SETTINGS' ? this.settingsReturnScreen : this.engine ? 'PAUSED' : 'MENU';
          this.render();
        };
        _proto.restartConfirmed = /*#__PURE__*/function () {
          var _restartConfirmed = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee10() {
            var _this$engine18, _this$clock11, _this$engine19, _this$world4;
            var owner;
            return _regeneratorRuntime().wrap(function _callee10$(_context10) {
              while (1) switch (_context10.prev = _context10.next) {
                case 0:
                  owner = this.ownerEpoch;
                case 1:
                  if (!this.saveInFlight) {
                    _context10.next = 6;
                    break;
                  }
                  _context10.next = 4;
                  return this.waitForSaveIdle();
                case 4:
                  _context10.next = 1;
                  break;
                case 6:
                  if (!(!this.isOwner() || owner !== this.ownerEpoch)) {
                    _context10.next = 8;
                    break;
                  }
                  return _context10.abrupt("return");
                case 8:
                  (_this$engine18 = this.engine) == null || _this$engine18.pause('MANUAL');
                  (_this$clock11 = this.clock) == null || _this$clock11.pause();
                  (_this$engine19 = this.engine) == null || _this$engine19.dispose();
                  this.engine = null;
                  this.adapter = null;
                  this.clock = null;
                  (_this$world4 = this.world) == null || _this$world4.destroy();
                  this.world = null;
                  this.ownerEpoch++;
                  this.screen = 'MENU';
                  this.render();
                  // Keep the durable envelope/revision as the compare-and-swap base. startNew atomically replaces it.
                  _context10.next = 21;
                  return this.startNew();
                case 21:
                case "end":
                  return _context10.stop();
              }
            }, _callee10, this);
          }));
          function restartConfirmed() {
            return _restartConfirmed.apply(this, arguments);
          }
          return restartConfirmed;
        }();
        _proto.returnToMenuConfirmed = /*#__PURE__*/function () {
          var _returnToMenuConfirmed = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee11() {
            var _this$engine20, _this$world5;
            var owner, ended;
            return _regeneratorRuntime().wrap(function _callee11$(_context11) {
              while (1) switch (_context11.prev = _context11.next) {
                case 0:
                  owner = this.ownerEpoch;
                case 1:
                  if (!this.saveInFlight) {
                    _context11.next = 6;
                    break;
                  }
                  _context11.next = 4;
                  return this.waitForSaveIdle();
                case 4:
                  _context11.next = 1;
                  break;
                case 6:
                  if (!(!this.isOwner() || owner !== this.ownerEpoch)) {
                    _context11.next = 8;
                    break;
                  }
                  return _context11.abrupt("return");
                case 8:
                  if (!(this.engine && !this.resultSaved)) {
                    _context11.next = 24;
                    break;
                  }
                  ended = this.engine.abandon();
                  if (!ended) {
                    _context11.next = 15;
                    break;
                  }
                  this.lastEvents.push(ended);
                  this.processEvents();
                  _context11.next = 15;
                  return this.commitResult();
                case 15:
                  if (!this.saveInFlight) {
                    _context11.next = 20;
                    break;
                  }
                  _context11.next = 18;
                  return this.waitForSaveIdle();
                case 18:
                  _context11.next = 15;
                  break;
                case 20:
                  if (!(!this.isOwner() || owner !== this.ownerEpoch || !this.resultSaved && !!this.activeSaveRepository())) {
                    _context11.next = 24;
                    break;
                  }
                  this.notice = this.resultError || '结果仍未保存，保留当前局面供重试。';
                  this.render();
                  return _context11.abrupt("return");
                case 24:
                  (_this$engine20 = this.engine) == null || _this$engine20.dispose();
                  this.engine = null;
                  this.adapter = null;
                  this.clock = null;
                  (_this$world5 = this.world) == null || _this$world5.destroy();
                  this.screen = 'MENU';
                  this.render();
                case 31:
                case "end":
                  return _context11.stop();
              }
            }, _callee11, this);
          }));
          function returnToMenuConfirmed() {
            return _returnToMenuConfirmed.apply(this, arguments);
          }
          return returnToMenuConfirmed;
        }();
        _proto.render = function render() {
          var _this$uiRoot2,
            _this12 = this,
            _this$world6,
            _this$effects10,
            _this$effects11;
          if (!((_this$uiRoot2 = this.uiRoot) != null && _this$uiRoot2.isValid)) return;
          this.buttons = [];
          this.buttonSkins.clear();
          this.previewGraphic = null;
          for (var _i5 = 0, _arr5 = [].concat(this.uiRoot.children); _i5 < _arr5.length; _i5++) {
            var child = _arr5[_i5];
            child.destroy();
          }
          this.labels.clear();
          if (this.artLoading) {
            this.themeBackground(true);
            if (this.art.getLoadedVariant('ui_title_logo')) this.themeSprite('ui_title_logo', 375, 900, 640, 224);else this.text('loading-brand', '奶茶挤挤', 375, 900, 72, new Color(103, 58, 32));
            this.text('loading', '正在准备杯子与小料…', 375, 480, 28);
            this.button('loading-start', '开始新局', 135, 330, 480, 104, function () {
              _this12.pendingStartRequested = true;
              _this12.notice = '已收到开始请求，准备完成后立即进入游戏。';
              _this12.render();
            });
            if (this.notice) {
              this.themePanel('ui_panel_toast', 375, 200, 670, 96);
              this.text('loading-notice', this.notice, 375, 200, 22);
            }
            this.drawButtons();
            return;
          }
          if (this.screen === 'MENU' || this.screen === 'SETTINGS' || this.screen === 'ERROR' || !((_this$world6 = this.world) != null && _this$world6.isValid)) this.themeBackground(this.screen === 'MENU');
          if (this.screen === 'MENU') this.renderMenu();else if (this.screen === 'PLAYING') this.renderGame();else if (this.screen === 'PAUSED') this.renderPause();else if (this.screen === 'SETTINGS') this.renderSettings();else if (this.screen === 'CONFIRM_RESTART' || this.screen === 'CONFIRM_MENU') this.renderConfirm();else if (this.screen === 'RESULTS') this.renderResults();else if (this.screen === 'REWARD') this.renderReward();else if (this.screen === 'REVIVE') this.renderRevive();else this.renderError();
          if (this.tutorialStep > 0) this.renderTutorial();
          this.drawButtons();
          if (this.screen === 'MENU') (_this$effects10 = this.effects) == null || _this$effects10.ensureCat(620, 820);else (_this$effects11 = this.effects) == null || _this$effects11.hideCat();
        };
        _proto.themeSprite = function themeSprite(id, x, y, w, h, parent) {
          if (parent === void 0) {
            parent = this.uiRoot;
          }
          if (!this.art.getLoadedVariant(id)) return null;
          var n = this.art.createSprite(parent, id, w, h, true);
          n.setPosition(x - 375, y - 667, 0);
          return n;
        };
        _proto.themeBackground = function themeBackground(brand) {
          if (brand === void 0) {
            brand = false;
          }
          var id = brand ? 'bg_brand' : 'bg_shop_base';
          var image = this.themeSprite(id, 375, 667, 750, 1334);
          if (image) {
            image.name = "ScreenBackground:" + id;
            this.coverBackground(image, id);
            return;
          }
          var size = presentationSize(),
            n = new Node('CreamBackground');
          this.uiRoot.addChild(n);
          n.addComponent(UITransform).setContentSize(size.width, size.height);
          var g = n.addComponent(Graphics);
          g.fillColor = new Color(255, 244, 225);
          g.rect(-size.width / 2, -size.height / 2, size.width, size.height);
          g.fill();
        };
        _proto.coverBackground = function coverBackground(node, id) {
          var variant = this.art.getLoadedVariant(id);
          if (!variant) return;
          var size = presentationSize(),
            scale = Math.max(size.width / variant.size[0], size.height / variant.size[1]);
          var ui = node.getComponent(UITransform);
          var w = variant.size[0] * scale,
            h = variant.size[1] * scale;
          if (Math.abs(ui.width - w) > 0.001 || Math.abs(ui.height - h) > 0.001) ui.setContentSize(w, h);
        };
        _proto.syncViewportBackgrounds = function syncViewportBackgrounds() {
          var _this$fixedBackground2;
          if ((_this$fixedBackground2 = this.fixedBackground) != null && _this$fixedBackground2.isValid) this.coverBackground(this.fixedBackground, 'bg_shop_base');
          var size = presentationSize();
          for (var _iterator6 = _createForOfIteratorHelperLoose((_this$uiRoot$children = (_this$uiRoot3 = this.uiRoot) == null ? void 0 : _this$uiRoot3.children) != null ? _this$uiRoot$children : []), _step6; !(_step6 = _iterator6()).done;) {
            var _this$uiRoot$children, _this$uiRoot3;
            var node = _step6.value;
            if (node.name.startsWith('ScreenBackground:')) this.coverBackground(node, node.name.substring('ScreenBackground:'.length));else if (node.name === 'ModalDim' || node.name === 'CreamBackground') {
              var ui = node.getComponent(UITransform),
                g = node.getComponent(Graphics);
              if (ui && g && (ui.width !== size.width || ui.height !== size.height)) {
                ui.setContentSize(size.width, size.height);
                g.clear();
                g.rect(-size.width / 2, -size.height / 2, size.width, size.height);
                g.fill();
              }
            }
          }
        };
        _proto.themePanel = function themePanel(id, x, y, w, h, dim) {
          if (dim === void 0) {
            dim = false;
          }
          if (dim) {
            var size = presentationSize(),
              n = new Node('ModalDim');
            this.uiRoot.addChild(n);
            n.addComponent(UITransform).setContentSize(size.width, size.height);
            var g = n.addComponent(Graphics);
            g.fillColor = new Color(62, 34, 21, 130);
            g.rect(-size.width / 2, -size.height / 2, size.width, size.height);
            g.fill();
          }
          this.themeSprite(id, x, y, w, h);
        };
        _proto.setButtonState = function setButtonState(id, state) {
          var skin = this.buttonSkins.get(id);
          if (skin != null && skin.node.isValid) this.art.setSpriteAsset(skin.node, "ui_btn_" + skin.family + "_" + state);
        };
        _proto.renderMenu = function renderMenu() {
          var _this$bundle$profile$11,
            _this$bundle$profile$12,
            _AppRuntime$rules$des,
            _AppRuntime$rules4,
            _AppRuntime$rules5,
            _this13 = this;
          this.themeSprite('ui_title_logo', 375, 1170, 650, 228);
          this.text('subtitle', '经典杯 · 挤出一杯好心情', 375, 1038, 28);
          this.themePanel('ui_panel_hud', 375, 962, 460, 74);
          this.text('record', "\u4E2A\u4EBA\u7EAA\u5F55  " + ((_this$bundle$profile$11 = (_this$bundle$profile$12 = this.bundle.profile.bestScoresByRules) == null || (_this$bundle$profile$12 = _this$bundle$profile$12[(_AppRuntime$rules$des = (_AppRuntime$rules4 = AppRuntime.rules) == null ? void 0 : _AppRuntime$rules4.design_rules_version) != null ? _AppRuntime$rules$des : '']) == null || (_this$bundle$profile$12 = _this$bundle$profile$12.classic) == null ? void 0 : _this$bundle$profile$12.standard) != null ? _this$bundle$profile$11 : 0), 375, 962, 30);
          var legacyRun = !!this.bundle.run && this.bundle.run.rulesVersion !== ((_AppRuntime$rules5 = AppRuntime.rules) == null ? void 0 : _AppRuntime$rules5.design_rules_version);
          if (this.bundle.run) this.button('continue', legacyRun ? '旧版局已保留' : '继续上局', 135, 354, 480, 100, function () {
            if (legacyRun) {
              _this13.notice = '旧版局已保留，不能放入新杯；开始新杯前可随时返回。';
              _this13.render();
            } else void _this13.restoreRun();
          });
          this.button('new', '开始新局', 135, this.bundle.run ? 226 : 354, 480, 100, function () {
            return legacyRun ? _this13.openModal('CONFIRM_RESTART') : void _this13.startNew();
          });
          this.button('settings', '游戏设置', 245, 102, 260, 90, function () {
            return _this13.openModal('SETTINGS');
          });
          if (legacyRun) this.text('legacy-save', '旧局已保留，确认新杯后才替换旧局。', 375, 530, 23);
          if (!this.persistent) this.text('storage', '当前仅内存模式，关闭后可能无法续局', 375, 65, 22);
          if (this.notice) {
            this.themePanel('ui_panel_toast', 375, 485, 670, 96);
            this.text('notice', this.notice, 375, 485, 23);
          }
        };
        _proto.renderGame = function renderGame() {
          var _this$engine21,
            _this$bundle$profile$13,
            _this$bundle$profile$14,
            _this$rewarded3,
            _this14 = this;
          var snap = (_this$engine21 = this.engine) == null ? void 0 : _this$engine21.snapshot();
          if (!snap) return;
          this.themePanel('ui_panel_hud', 375, 1265, 700, 88);
          this.text('score', "\u5206\u6570 " + snap.score + "  \xB7  \u7EAA\u5F55 " + ((_this$bundle$profile$13 = (_this$bundle$profile$14 = this.bundle.profile.bestScoresByRules) == null || (_this$bundle$profile$14 = _this$bundle$profile$14[snap.rulesVersion]) == null || (_this$bundle$profile$14 = _this$bundle$profile$14.classic) == null ? void 0 : _this$bundle$profile$14.standard) != null ? _this$bundle$profile$13 : 0), 375, 1265, 32);
          this.themePanel('ui_panel_hud', 338, 1175, 600, 76);
          this.text('next', "\u5F53\u524D " + this.levelName(snap.currentLevel) + "  \xB7  \u6700\u9AD8 " + this.levelName(snap.maxLevel), 330, 1175, 25);
          this.themePanel('ui_panel_next', 665, 1135, 110, 110);
          this.themeSprite(ArtCatalog.ingredientId(AppRuntime.rules.ingredients[snap.nextLevel - 1].id), 665, 1135, 76, 76);
          this.text('danger', snap.dangerTicks ? "\u5FEB\u6EE1\u4E86 \xB7 " + Math.max(1, 3 - Math.floor(snap.dangerTicks / 60)) : '同级相遇，合成更大颗', 375, 1100, 25, snap.dangerTicks ? new Color(185, 54, 43) : new Color(103, 63, 38));
          var due = Math.max(0, snap.autoDrop.nextDueTick - snap.tick);
          this.themePanel('ui_panel_modal', 375, 250, 620, 142);
          this.text('preview', "\u81EA\u52A8\u843D\u6599 \xB7 " + Math.ceil(due / AppRuntime.rules.physics.fixed_hz) + "\u79D2\u540E\u4E0B\u4E00\u9897 \xB7 \u6309\u4F4F\u676F\u5B50\u5DE6\u53F3\u79FB\u52A8", 375, 250, 22);
          var planned = snap.autoDrop.pendingSpawn,
            mark = new Node('AutoDropSpawnPreview');
          this.uiRoot.addChild(mark);
          mark.setPosition(planned.xDu - 375, Math.min(AppRuntime.rules.cup.spawn_y_du, AppRuntime.rules.viewport.height_du - 130) - 667, 0);
          mark.addComponent(UITransform).setContentSize(12, 12);
          var dot = mark.addComponent(Graphics);
          dot.fillColor = new Color(255, 199, 93, 230);
          dot.circle(0, 0, 6);
          dot.fill();
          this.drawGameIndicators(snap);
          var shakeLeft = Math.max(0, 2 - snap.shake.baseUsed),
            extraLeft = Math.max(0, snap.shake.extraGranted - snap.shake.extraUsed),
            activeLeft = snap.shake.activeStartTick === null ? 0 : Math.max(0, snap.shake.activeStartTick + 48 - snap.tick),
            cooldownLeft = Math.max(0, snap.shake.cooldownUntilTick - snap.tick);
          var rewardedView = (_this$rewarded3 = this.rewarded) == null ? void 0 : _this$rewarded3.getView();
          var shakeLabel = activeLeft > 0 ? '晃杯中…' : cooldownLeft > 0 ? '晃杯冷却' : shakeLeft > 0 ? "\u6643\u676F " + shakeLeft : extraLeft > 0 ? "\u5E7F\u544A\u6643\u676F " + extraLeft : rewardedView != null && rewardedView.pendingAttempt ? '奖励待确认' : '看广告 +1 次';
          this.button('shake', shakeLabel, 42, 48, 200, 96, function () {
            if (shakeLeft > 0 || extraLeft > 0) _this14.enqueue('SHAKE');else _this14.openRewardedOffer();
          });
          this.button('pause', '暂停', 508, 48, 200, 96, function () {
            return _this14.togglePause();
          });
          if (this.notice && /失败|错误|异常|冲突|无法/.test(this.notice)) {
            this.themePanel('ui_panel_toast', 375, 340, 650, 52);
            this.text('notice', this.notice, 375, 340, 20);
          }
        };
        _proto.renderPause = function renderPause() {
          var _this15 = this;
          this.themePanel('ui_panel_modal', 375, 685, 620, 850, true);
          this.text('paused', '休息一下', 375, 1010, 44);
          this.button('resume', '继续游戏', 185, 800, 380, 96, function () {
            return void _this15.continueRun();
          });
          this.button('settings', '设置', 185, 670, 380, 96, function () {
            return _this15.openModal('SETTINGS');
          });
          this.button('restart', '重新开始', 185, 540, 380, 96, function () {
            return _this15.openModal('CONFIRM_RESTART');
          });
          this.button('menu', '返回菜单', 185, 410, 380, 96, function () {
            return _this15.openModal('CONFIRM_MENU');
          });
          if (this.notice) this.text('notice', this.notice, 375, 330, 22);
        };
        _proto.renderGameBase = function renderGameBase() {
          var _this$engine22;
          var s = (_this$engine22 = this.engine) == null ? void 0 : _this$engine22.snapshot();
          if (s) this.text('score', "\u5206\u6570 " + s.score + "  \xB7  \u5F53\u524D " + this.levelName(s.currentLevel) + " / \u4E0B\u4EFD " + this.levelName(s.nextLevel), 375, 1260, 30);
        };
        _proto.drawGameIndicators = function drawGameIndicators(snap) {
          var _rules$ingredients$fi, _rules$ingredients$fi2, _marker$getComponent;
          var rules = AppRuntime.rules,
            cx = rules.viewport.width_du / 2,
            cy = rules.viewport.height_du / 2;
          var line = new Node('P1BDangerLine');
          this.uiRoot.addChild(line);
          var lineGraphics = line.addComponent(Graphics);
          lineGraphics.lineWidth = 4;
          lineGraphics.strokeColor = new Color(220, 86, 54, 210);
          var cupX = rules.cup.center_x_du + snap.cupMotion.offsetXDu;
          var left = cupX - rules.cup.top_width_du / 2 - cx,
            right = cupX + rules.cup.top_width_du / 2 - cx,
            y = rules.cup.danger_line_y_du - cy;
          for (var x = left; x < right; x += 28) {
            lineGraphics.moveTo(x, y);
            lineGraphics.lineTo(Math.min(right, x + 17), y);
          }
          lineGraphics.stroke();
          var radius = (_rules$ingredients$fi = (_rules$ingredients$fi2 = rules.ingredients.find(function (i) {
            return i.level === snap.currentLevel;
          })) == null ? void 0 : _rules$ingredients$fi2.radius_du) != null ? _rules$ingredients$fi : 18;
          var marker = this.themeSprite(ArtCatalog.ingredientId(rules.ingredients[snap.currentLevel - 1].id), this.previewX, rules.cup.spawn_y_du, 2 * radius / .9, 2 * radius / .9);
          this.previewGraphic = (_marker$getComponent = marker == null ? void 0 : marker.getComponent(Sprite)) != null ? _marker$getComponent : null;
        };
        _proto.updatePreviewPosition = function updatePreviewPosition() {
          var _this$previewGraphic;
          var rules = AppRuntime.rules;
          if (!rules || !((_this$previewGraphic = this.previewGraphic) != null && (_this$previewGraphic = _this$previewGraphic.node) != null && _this$previewGraphic.isValid)) return;
          this.previewGraphic.node.setPosition(this.previewX - rules.viewport.width_du / 2, rules.cup.spawn_y_du - rules.viewport.height_du / 2, 0);
        };
        _proto.renderSettings = function renderSettings() {
          var _this16 = this;
          this.themePanel('ui_panel_modal', 375, 730, 650, 1110, true);
          this.text('settings-title', '设置', 375, 1170, 48);
          var settings = this.bundle.profile.settings;
          this.drawVolume('music', this.bundle.profile.settings.musicGain, 998);
          this.drawVolume('sfx', this.bundle.profile.settings.sfxGain, 778);
          this.text('music-gain', "\u97F3\u4E50\u97F3\u91CF  " + Math.round(settings.musicGain * 100) + "%", 375, 1050, 30);
          this.button('music-down', '−', 135, 950, 100, 96, function () {
            return _this16.changeGain('musicGain', -.1);
          });
          this.button('music-up', '+', 515, 950, 100, 96, function () {
            return _this16.changeGain('musicGain', .1);
          });
          this.text('sfx-gain', "\u97F3\u6548\u97F3\u91CF  " + Math.round(settings.sfxGain * 100) + "%", 375, 830, 30);
          this.button('sfx-down', '−', 135, 730, 100, 96, function () {
            return _this16.changeGain('sfxGain', -.1);
          });
          this.button('sfx-up', '+', 515, 730, 100, 96, function () {
            return _this16.changeGain('sfxGain', .1);
          });
          this.button('motion', "\u5F31\u52A8\u6001\uFF1A" + (this.reducedMotion ? '开启' : '关闭'), 185, 460, 380, 96, function () {
            _this16.reducedMotion = !_this16.reducedMotion;
            _this16.persistSettings();
            _this16.render();
          });
          this.button('tutorial-replay', '重看三步引导', 185, 340, 380, 96, function () {
            return _this16.beginTutorial();
          });
          this.button('back', '返回', 185, 220, 380, 96, function () {
            return _this16.closeModal();
          });
          if (this.audioFailure) this.button('retry-audio', this.audioLoading ? '正在重试…' : '重试声音加载', 185, 130, 380, 96, function () {
            return void _this16.loadAudioClips(true);
          });
          var soundStatus = this.audioFailures.size ? "\u58F0\u97F3\u8D44\u6E90\u7F3A\u5931 " + this.audioFailures.size + " \u9879\uFF0C\u53EF\u70B9\u51FB\u91CD\u8BD5" : this.audio ? '声音已加载' : '首次操作后自动加载声音';
          var saveStatus = this.persistent ? '设置自动保存到本机' : '仅内存模式：设置不保证跨关闭保留';
          this.themePanel('ui_panel_toast', 375, 105, 670, 104);
          this.text('settings-status', soundStatus + "\n" + saveStatus, 375, 105, 21);
        };
        _proto.drawVolume = function drawVolume(kind, gain, y) {
          this.themeSprite('ui_slider_track_empty', 375, y, 264, 25);
          var fill = this.themeSprite('ui_slider_fill_full', 375, y, 264, 25);
          var sprite = fill == null ? void 0 : fill.getComponent(Sprite);
          if (sprite) {
            sprite.type = Sprite.Type.FILLED;
            sprite.fillType = Sprite.FillType.HORIZONTAL;
            sprite.fillStart = 0;
            sprite.fillRange = gain;
          }
          this.themeSprite('ui_slider_knob', 251 + 248 * gain, y, 42, 42);
          this.themeSprite(kind === 'music' ? 'ui_icon_music_on' : 'ui_icon_sfx_on', 100, y + 52, 40, 40);
        };
        _proto.changeGain = function changeGain(field, delta) {
          var _extends6, _this$audio11;
          var settings = this.bundle.profile.settings,
            pct = Math.max(0, Math.min(100, Math.round(settings[field] * 100 + delta * 100)));
          this.bundle = _extends({}, this.bundle, {
            profile: _extends({}, this.bundle.profile, {
              settings: _extends({}, settings, (_extends6 = {}, _extends6[field] = pct / 100, _extends6))
            })
          });
          (_this$audio11 = this.audio) == null || _this$audio11.setVolumes(this.bundle.profile.settings.musicGain, this.bundle.profile.settings.sfxGain);
          this.persistSettings();
          this.render();
        };
        _proto.unlockAudioFromGesture = function unlockAudioFromGesture() {
          this.audioUnlockRequested = true;
          if (this.audio) {
            this.audio.requestMusicFromGesture();
            return;
          }
          if (!this.audioLoading && !this.audioFailures.size) void this.loadAudioClips();
        };
        _proto.loadAudioClips = /*#__PURE__*/function () {
          var _loadAudioClips = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee13(retry) {
            var _this17 = this;
            var cues, needed, _this$audio12, loaded, _iterator7, _step7, item, _iterator8, _step8, _item, _this$audio13;
            return _regeneratorRuntime().wrap(function _callee13$(_context13) {
              while (1) switch (_context13.prev = _context13.next) {
                case 0:
                  if (retry === void 0) {
                    retry = false;
                  }
                  if (!this.audioLoading) {
                    _context13.next = 3;
                    break;
                  }
                  return _context13.abrupt("return");
                case 3:
                  this.audioLoading = true;
                  if (retry) this.audioFailures.clear();
                  cues = ['bgm_classic', 'ui_tap', 'drop', 'collision_soft', 'merge_small', 'merge_large', 'shake_start', 'danger_tick', 'result'];
                  needed = cues.filter(function (cue) {
                    return !_this17.audioClips[cue] && (retry || !_this17.audioFailures.has(cue));
                  });
                  _context13.prev = 7;
                  _context13.next = 10;
                  return Promise.all(needed.map( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee12(cue) {
                    return _regeneratorRuntime().wrap(function _callee12$(_context12) {
                      while (1) switch (_context12.prev = _context12.next) {
                        case 0:
                          _context12.prev = 0;
                          _context12.t0 = cue;
                          _context12.next = 4;
                          return _this17.loadAudioClip(cue);
                        case 4:
                          _context12.t1 = _context12.sent;
                          return _context12.abrupt("return", {
                            cue: _context12.t0,
                            clip: _context12.t1,
                            error: null
                          });
                        case 8:
                          _context12.prev = 8;
                          _context12.t2 = _context12["catch"](0);
                          return _context12.abrupt("return", {
                            cue: cue,
                            clip: null,
                            error: _context12.t2 instanceof Error ? _context12.t2 : new Error(String(_context12.t2))
                          });
                        case 11:
                        case "end":
                          return _context12.stop();
                      }
                    }, _callee12, null, [[0, 8]]);
                  }))));
                case 10:
                  loaded = _context13.sent;
                  if (this.isOwner()) {
                    _context13.next = 14;
                    break;
                  }
                  for (_iterator7 = _createForOfIteratorHelperLoose(loaded); !(_step7 = _iterator7()).done;) {
                    item = _step7.value;
                    if (item.clip) resources.release("audio/p1c/" + item.cue, AudioClip);
                  }
                  return _context13.abrupt("return");
                case 14:
                  if (!this.audio && loaded.some(function (item) {
                    return item.clip;
                  })) this.audio = new GameAudio(this.node, {}, this.bundle.profile.settings.musicGain, this.bundle.profile.settings.sfxGain);
                  for (_iterator8 = _createForOfIteratorHelperLoose(loaded); !(_step8 = _iterator8()).done;) {
                    _item = _step8.value;
                    if (_item.clip) {
                      this.audioClips[_item.cue] = _item.clip;
                      (_this$audio13 = this.audio) == null || _this$audio13.addClip(_item.cue, _item.clip);
                    } else {
                      this.audioFailures.add(_item.cue);
                      this.releaseAudioClip(_item.cue);
                    }
                  }
                  this.audioFailure = this.audioFailures.size ? Array.from(this.audioFailures).join('、') : '';
                  if (this.audioUnlockRequested) (_this$audio12 = this.audio) == null || _this$audio12.requestMusicFromGesture();
                  _context13.next = 23;
                  break;
                case 20:
                  _context13.prev = 20;
                  _context13.t0 = _context13["catch"](7);
                  this.audioFailure = String(_context13.t0);
                case 23:
                  _context13.prev = 23;
                  this.audioLoading = false;
                  if (this.screen !== 'PLAYING') this.render();
                  return _context13.finish(23);
                case 27:
                case "end":
                  return _context13.stop();
              }
            }, _callee13, this, [[7, 20, 23, 27]]);
          }));
          function loadAudioClips(_x5) {
            return _loadAudioClips.apply(this, arguments);
          }
          return loadAudioClips;
        }();
        _proto.loadAudioClip = /*#__PURE__*/function () {
          var _loadAudioClip = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee14(cue) {
            var path, bundle;
            return _regeneratorRuntime().wrap(function _callee14$(_context14) {
              while (1) switch (_context14.prev = _context14.next) {
                case 0:
                  path = "audio/p1c/" + cue;
                  if (!resources.getInfoWithPath(path, AudioClip)) {
                    _context14.next = 5;
                    break;
                  }
                  _context14.t0 = resources;
                  _context14.next = 8;
                  break;
                case 5:
                  _context14.next = 7;
                  return this.loadClassicBundle();
                case 7:
                  _context14.t0 = _context14.sent;
                case 8:
                  bundle = _context14.t0;
                  if (bundle) {
                    _context14.next = 11;
                    break;
                  }
                  throw new Error("\u97F3\u9891\u5305\u7F3A\u5931: " + cue);
                case 11:
                  _context14.next = 13;
                  return new Promise(function (resolve, reject) {
                    return bundle.load(path, AudioClip, null, function (error, clip) {
                      return error || !clip ? reject(error != null ? error : new Error("\u97F3\u9891\u7F3A\u5931: " + cue)) : resolve(clip);
                    });
                  });
                case 13:
                  return _context14.abrupt("return", _context14.sent);
                case 14:
                case "end":
                  return _context14.stop();
              }
            }, _callee14, this);
          }));
          function loadAudioClip(_x7) {
            return _loadAudioClip.apply(this, arguments);
          }
          return loadAudioClip;
        }();
        _proto.loadRequiredArt = function loadRequiredArt() {
          var _this18 = this;
          var rules = AppRuntime.rules;
          if (!rules) throw new Error('配置未初始化');
          return _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee15() {
            var ids;
            return _regeneratorRuntime().wrap(function _callee15$(_context15) {
              while (1) switch (_context15.prev = _context15.next) {
                case 0:
                  if (!_this18.art.catalog.ids.includes('ui_title_logo')) {
                    _context15.next = 4;
                    break;
                  }
                  _context15.next = 3;
                  return _this18.art.load('ui_title_logo', 750);
                case 3:
                  if (_this18.artLoading && _this18.isOwner()) _this18.render();
                case 4:
                  ids = _this18.art.catalog.ids.filter(function (id) {
                    return id === 'bg_brand' || id === 'ui_title_logo' || id === 'ui_panel_hud' || id === 'ui_panel_toast' || id.startsWith('ui_btn_') || ['ui_icon_play', 'ui_icon_continue', 'ui_icon_settings', 'ui_icon_warning', 'ui_icon_close', 'ui_icon_back'].includes(id);
                  });
                  _context15.next = 7;
                  return _this18.loadArtBatch(ids);
                case 7:
                case "end":
                  return _context15.stop();
              }
            }, _callee15);
          }))();
        };
        _proto.loadArtBatch = /*#__PURE__*/function () {
          var _loadArtBatch = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee16(ids) {
            var _this19 = this;
            var start;
            return _regeneratorRuntime().wrap(function _callee16$(_context16) {
              while (1) switch (_context16.prev = _context16.next) {
                case 0:
                  start = 0;
                case 1:
                  if (!(start < ids.length)) {
                    _context16.next = 7;
                    break;
                  }
                  _context16.next = 4;
                  return Promise.all(ids.slice(start, start + 4).map(function (id) {
                    return _this19.art.load(id, id.startsWith('spr_ing_') ? 700 : 1000);
                  }));
                case 4:
                  start += 4;
                  _context16.next = 1;
                  break;
                case 7:
                case "end":
                  return _context16.stop();
              }
            }, _callee16);
          }));
          function loadArtBatch(_x8) {
            return _loadArtBatch.apply(this, arguments);
          }
          return loadArtBatch;
        }();
        _proto.loadGameArt = /*#__PURE__*/function () {
          var _loadGameArt = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee17() {
            return _regeneratorRuntime().wrap(function _callee17$(_context17) {
              while (1) switch (_context17.prev = _context17.next) {
                case 0:
                  _context17.next = 2;
                  return this.loadArtBatch(this.art.catalog.ids.filter(function (id) {
                    return !id.startsWith('bg_shop_extend_');
                  }));
                case 2:
                case "end":
                  return _context17.stop();
              }
            }, _callee17, this);
          }));
          function loadGameArt() {
            return _loadGameArt.apply(this, arguments);
          }
          return loadGameArt;
        }();
        _proto.retryArtAndStart = /*#__PURE__*/function () {
          var _retryArtAndStart = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee19() {
            var _this20 = this;
            var owner, generation, task;
            return _regeneratorRuntime().wrap(function _callee19$(_context19) {
              while (1) switch (_context19.prev = _context19.next) {
                case 0:
                  if (!this.artRetryTask) {
                    _context19.next = 2;
                    break;
                  }
                  return _context19.abrupt("return", this.artRetryTask);
                case 2:
                  if (!this.loading) {
                    _context19.next = 4;
                    break;
                  }
                  return _context19.abrupt("return");
                case 4:
                  owner = this.ownerEpoch, generation = ++this.artLoadGeneration;
                  task = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee18() {
                    return _regeneratorRuntime().wrap(function _callee18$(_context18) {
                      while (1) switch (_context18.prev = _context18.next) {
                        case 0:
                          _this20.loading = true;
                          _this20.artLoading = true;
                          _this20.notice = '正在重试资源加载…';
                          _this20.render();
                          _context18.prev = 4;
                          if (_this20.art.catalog) {
                            _context18.next = 11;
                            break;
                          }
                          _context18.next = 8;
                          return _this20.art.initialize();
                        case 8:
                          if (!(!_this20.isOwner() || owner !== _this20.ownerEpoch || generation !== _this20.artLoadGeneration)) {
                            _context18.next = 10;
                            break;
                          }
                          return _context18.abrupt("return");
                        case 10:
                          _this20.artReady = true;
                        case 11:
                          _context18.next = 13;
                          return _this20.loadRequiredArt();
                        case 13:
                          if (!(!_this20.isOwner() || owner !== _this20.ownerEpoch || generation !== _this20.artLoadGeneration)) {
                            _context18.next = 15;
                            break;
                          }
                          return _context18.abrupt("return");
                        case 15:
                          _this20.artLoading = false;
                          _this20.screen = 'MENU';
                          _this20.notice = _this20.bundle.run ? '资源已恢复。请选择继续上局或开始新局。' : '';
                          _this20.render();
                          _this20.publishDiagnostics();
                          void _this20.loadAudioClips();
                          _context18.next = 26;
                          break;
                        case 23:
                          _context18.prev = 23;
                          _context18.t0 = _context18["catch"](4);
                          if (_this20.isOwner() && owner === _this20.ownerEpoch && generation === _this20.artLoadGeneration) {
                            _this20.artLoading = false;
                            _this20.screen = 'ERROR';
                            _this20.notice = "\u8D44\u6E90\u91CD\u8BD5\u5931\u8D25\uFF1A" + String(_context18.t0);
                            _this20.render();
                          }
                        case 26:
                          _context18.prev = 26;
                          if (_this20.isOwner() && owner === _this20.ownerEpoch && generation === _this20.artLoadGeneration) {
                            _this20.loading = false;
                            _this20.artRetryTask = null;
                          }
                          return _context18.finish(26);
                        case 29:
                        case "end":
                          return _context18.stop();
                      }
                    }, _callee18, null, [[4, 23, 26, 29]]);
                  }))();
                  this.artRetryTask = task;
                  return _context19.abrupt("return", task);
                case 8:
                case "end":
                  return _context19.stop();
              }
            }, _callee19, this);
          }));
          function retryArtAndStart() {
            return _retryArtAndStart.apply(this, arguments);
          }
          return retryArtAndStart;
        }();
        _proto.loadClassicBundle = function loadClassicBundle() {
          var _this21 = this;
          if (this.classicBundle) return Promise.resolve(this.classicBundle);
          if (this.classicBundleLoad) return this.classicBundleLoad;
          var task = new Promise(function (resolve) {
            return assetManager.loadBundle('classic', function (error, bundle) {
              return resolve(error || !bundle ? null : bundle);
            });
          }).then(function (bundle) {
            _this21.classicBundle = bundle;
            return bundle;
          });
          this.classicBundleLoad = task;
          var clear = function clear() {
            if (_this21.classicBundleLoad === task) _this21.classicBundleLoad = null;
          };
          void task.then(clear, clear);
          return task;
        };
        _proto.releaseAudioClip = function releaseAudioClip(cue) {
          if (this.classicBundle) this.classicBundle.release("audio/p1c/" + cue, AudioClip);else resources.release("audio/p1c/" + cue, AudioClip);
        };
        _proto.beginTutorial = function beginTutorial() {
          this.tutorialReturnScreen = this.screen;
          this.tutorialStep = 1;
          this.cancelPointer();
          this.pauseOwners.add('MODAL');
          if (this.engine) {
            var _this$clock12;
            this.engine.pause('MODAL');
            (_this$clock12 = this.clock) == null || _this$clock12.pause();
          }
          this.render();
        };
        _proto.renderTutorial = function renderTutorial() {
          var _this$labels$get2,
            _this22 = this;
          this.buttons = [];
          var scrim = new Node('TutorialScrim');
          this.uiRoot.addChild(scrim);
          var tr = scrim.addComponent(UITransform);
          tr.setContentSize(750, 1334);
          var g = scrim.addComponent(Graphics);
          g.fillColor = new Color(35, 28, 22, 185);
          g.rect(-375, -667, 750, 1334);
          g.fill();
          this.themePanel('ui_panel_modal', 375, 850, 680, 700);
          var copy = [['第 1 步 · 自动落料', '小料会定时落下，按住杯子左右移动来接料。'], ['第 2 步 · 同级会合成', '相同等级的小料相遇会合成，留意杯内危险线。'], ['第 3 步 · 晃杯与暂停', '每局可晃杯两次；暂停后明确继续，稍等一秒再落料。']][this.tutorialStep - 1];
          this.text('tutorial-title', copy[0], 375, 1080, 33);
          this.text('tutorial-copy', copy[1], 375, 950, 27);
          (_this$labels$get2 = this.labels.get('tutorial-copy')) == null || (_this$labels$get2 = _this$labels$get2.node.getComponent(UITransform)) == null || _this$labels$get2.setContentSize(560, 125);
          this.themeSprite(this.tutorialStep === 1 ? 'ui_tutorial_hand_move' : this.tutorialStep === 2 ? 'fx_merge_ring' : 'ui_icon_shake', 375, 805, 130, 130);
          this.button('tutorial-next', this.tutorialStep === 3 ? '开始这杯' : '下一步', 80, 650, 270, 96, function () {
            if (_this22.tutorialStep < 3) {
              _this22.tutorialStep++;
              _this22.render();
            } else void _this22.finishTutorial(true);
          });
          this.button('tutorial-skip', '跳过并开始', 400, 650, 270, 96, function () {
            return void _this22.finishTutorial(true);
          });
        };
        _proto.finishTutorial = /*#__PURE__*/function () {
          var _finishTutorial = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee20(markComplete) {
            var _AppRuntime$rules6;
            var target, host, resumed;
            return _regeneratorRuntime().wrap(function _callee20$(_context20) {
              while (1) switch (_context20.prev = _context20.next) {
                case 0:
                  this.tutorialStep = 0;
                  this.pauseOwners["delete"]('MODAL');
                  if (markComplete) this.bundle = _extends({}, this.bundle, {
                    profile: _extends({}, this.bundle.profile, {
                      tutorialRulesVersion: (_AppRuntime$rules6 = AppRuntime.rules) == null ? void 0 : _AppRuntime$rules6.design_rules_version,
                      settings: _extends({}, this.bundle.profile.settings, {
                        tutorialCompleted: true
                      })
                    })
                  });
                  target = this.tutorialReturnScreen;
                  this.screen = target;
                  if (target === 'PLAYING' && this.engine && this.clock) {
                    host = HostLifecycleCoordinator.snapshot();
                    if (!host.backgrounded && !host.resumeRequired) {
                      resumed = this.engine.resume();
                      if (resumed.ok) {
                        this.pauseOwners.clear();
                        this.clock.resume();
                      }
                    } else {
                      this.screen = 'PAUSED';
                      this.pauseOwners.add(host.backgrounded ? 'HOST_HIDDEN' : 'RESUME_REQUIRED');
                    }
                  }
                  this.render();
                  if (markComplete) void this.persistSettings();
                case 8:
                case "end":
                  return _context20.stop();
              }
            }, _callee20, this);
          }));
          function finishTutorial(_x9) {
            return _finishTutorial.apply(this, arguments);
          }
          return finishTutorial;
        }();
        _proto.showMergeFeedback = function showMergeFeedback(position, score) {
          var x = position.x - 375,
            y = position.y - 667;
          this.showTextFeedback("+" + score, x, y, new Color(112, 57, 25));
          var ring = this.themeSprite('fx_merge_ring', position.x, position.y, 110, 110);
          if (!ring) return;
          ring.name = "MergeRing-" + ++this.feedbackSequence;
          var opacity = ring.addComponent(UIOpacity);
          var end = this.reducedMotion ? 0.14 : 0.22;
          tween(ring).to(end, {
            scale: new Vec3(this.reducedMotion ? 1.25 : 1.7, this.reducedMotion ? 1.25 : 1.7, 1)
          }).start();
          tween(opacity).to(end, {
            opacity: 0
          }).call(function () {
            return ring.destroy();
          }).start();
        };
        _proto.showTextFeedback = function showTextFeedback(value, x, y, color) {
          var _this$uiRoot4;
          if (!((_this$uiRoot4 = this.uiRoot) != null && _this$uiRoot4.isValid)) return;
          var n = new Node("Feedback-" + ++this.feedbackSequence);
          this.uiRoot.addChild(n);
          n.setPosition(x, y, 0);
          n.addComponent(UITransform).setContentSize(240, 64);
          var label = n.addComponent(Label);
          label.string = value;
          label.fontSize = 32;
          label.lineHeight = 38;
          label.color = color;
          label.isBold = true;
          var opacity = n.addComponent(UIOpacity);
          var duration = this.reducedMotion ? 0.12 : 0.48;
          tween(n).to(duration, {
            position: new Vec3(x, y + (this.reducedMotion ? 8 : 24), 0)
          }).start();
          tween(opacity).delay(duration * .45).to(duration * .55, {
            opacity: 0
          }).call(function () {
            return n.destroy();
          }).start();
        };
        _proto.readContactFeedback = function readContactFeedback() {
          var _AppRuntime$rules$vie,
            _AppRuntime$rules7,
            _this23 = this;
          if (!this.adapter || !this.engine) return;
          var tick = this.engine.tick,
            live = new Set(this.engine.snapshot().ingredients.map(function (item) {
              return item.entityId;
            }));
          for (var _iterator9 = _createForOfIteratorHelperLoose(this.contactObjectTicks.keys()), _step9; !(_step9 = _iterator9()).done;) {
            var id = _step9.value;
            if (!live.has(id)) this.contactObjectTicks["delete"](id);
          }
          var next = new Set(),
            minimumSpeed = .5 * ((_AppRuntime$rules$vie = (_AppRuntime$rules7 = AppRuntime.rules) == null ? void 0 : _AppRuntime$rules7.viewport.du_per_spec_physics_unit) != null ? _AppRuntime$rules$vie : 100);
          var _loop2 = function _loop2() {
              var _this23$effects, _this23$audio;
              var pair = _step10.value;
              next.add(pair.contactId);
              if (_this23.contactPairs.has(pair.contactId) || Math.abs(pair.normalSpeed) < minimumSpeed || tick - _this23.lastContactFeedbackTick < 10) return 0; // continue
              var objects = [pair.firstId, pair.secondId].filter(function (id) {
                return id !== null && live.has(id);
              });
              if (!objects.length || objects.some(function (id) {
                var _this23$contactObject;
                return tick - ((_this23$contactObject = _this23.contactObjectTicks.get(id)) != null ? _this23$contactObject : -60) < 8;
              })) return 0; // continue
              _this23.lastContactFeedbackTick = tick;
              var fxItem = _this23.engine.snapshot().ingredients.find(function (i) {
                return objects.includes(i.entityId);
              });
              if (fxItem) void ((_this23$effects = _this23.effects) == null ? void 0 : _this23$effects.play(pair.secondId === null ? 'drop' : 'collision', fxItem.positionDu.x, fxItem.positionDu.y, tick + ":" + pair.contactId, _this23.reducedMotion));
              (_this23$audio = _this23.audio) == null || _this23$audio.play('collision_soft');
              for (var _iterator11 = _createForOfIteratorHelperLoose(objects), _step11; !(_step11 = _iterator11()).done;) {
                var _id2 = _step11.value;
                _this23.contactObjectTicks.set(_id2, tick);
              }
              for (var _iterator12 = _createForOfIteratorHelperLoose(objects), _step12; !(_step12 = _iterator12()).done;) {
                var _this23$world;
                var _id3 = _step12.value;
                var visual = (_this23$world = _this23.world) == null ? void 0 : _this23$world.getChildByName("P1BIngredientVisual-" + _id3);
                if (!(visual != null && visual.isValid)) continue;
                Tween.stopAllByTarget(visual);
                var squeeze = _this23.reducedMotion ? 0.96 : 0.92;
                tween(visual).to(.06, {
                  scale: new Vec3(1.04, squeeze, 1)
                }).to(.08, {
                  scale: new Vec3(1, 1, 1)
                }).start();
              }
            },
            _ret;
          for (var _iterator10 = _createForOfIteratorHelperLoose(this.adapter.getContacts()), _step10; !(_step10 = _iterator10()).done;) {
            _ret = _loop2();
            if (_ret === 0) continue;
          }
          this.contactPairs = next;
        };
        _proto.renderConfirm = function renderConfirm() {
          var _AppRuntime$rules8,
            _this24 = this;
          this.themePanel('ui_panel_modal', 375, 885, 660, 470, true);
          var legacyRun = this.screen === 'CONFIRM_RESTART' && !this.engine && !!this.bundle.run && this.bundle.run.rulesVersion !== ((_AppRuntime$rules8 = AppRuntime.rules) == null ? void 0 : _AppRuntime$rules8.design_rules_version);
          this.text('confirm', legacyRun ? '玩法规则已更新。取消会完整保留旧局；确认后新局使用窄杯自动落料，旧纪录与设置保留。' : '确认重新开始？未保存进度将按最近完整保存恢复。', 375, 930, 26);
          this.button('yes', '确认', 60, 790, 270, 96, function () {
            return _this24.screen === 'CONFIRM_RESTART' ? void _this24.restartConfirmed() : void _this24.returnToMenuConfirmed();
          });
          this.button('no', '取消', 420, 790, 270, 96, function () {
            return _this24.closeModal();
          });
        };
        _proto.renderResults = function renderResults() {
          var _this$engine23,
            _ref4,
            _r$score,
            _ref5,
            _r$score2,
            _ref6,
            _r$maxLevel,
            _ref7,
            _r$dropIndex,
            _ref8,
            _r$baseUsed,
            _this25 = this;
          this.themePanel('ui_panel_results', 375, 720, 650, 1000, true);
          var r = this.bundle.lastResult;
          var s = (_this$engine23 = this.engine) == null ? void 0 : _this$engine23.snapshot();
          if (((_ref4 = (_r$score = r == null ? void 0 : r.score) != null ? _r$score : s == null ? void 0 : s.score) != null ? _ref4 : 0) > this.runBestScoreAtStart) this.themeSprite('ui_badge_record', 375, 1140, 170, 85);
          this.text('result-title', (r == null ? void 0 : r.reason) === 'SPILLED' ? '小料洒出来了' : '这杯加满了', 375, 1050, 44);
          this.text('result-score', "\u5F97\u5206 " + ((_ref5 = (_r$score2 = r == null ? void 0 : r.score) != null ? _r$score2 : s == null ? void 0 : s.score) != null ? _ref5 : 0) + "  \xB7  \u6700\u9AD8\u7B49\u7EA7 " + ((_ref6 = (_r$maxLevel = r == null ? void 0 : r.maxLevel) != null ? _r$maxLevel : s == null ? void 0 : s.maxLevel) != null ? _ref6 : 1), 375, 940, 30);
          this.text('result-drops', "\u6295\u653E " + ((_ref7 = (_r$dropIndex = r == null ? void 0 : r.dropIndex) != null ? _r$dropIndex : s == null ? void 0 : s.dropIndex) != null ? _ref7 : 0) + " \u6B21  \xB7  \u6643\u676F " + ((_ref8 = (_r$baseUsed = r == null ? void 0 : r.baseUsed) != null ? _r$baseUsed : s == null ? void 0 : s.shake.baseUsed) != null ? _ref8 : 0) + "/2", 375, 875, 24);
          this.text('save-status', this.resultSaved ? '已保存' : this.resultError || '正在保存结算…', 375, 790, 22, this.resultSaved ? new Color(49, 114, 72) : new Color(160, 74, 41));
          this.button('again', '再来一杯', 160, 650, 430, 96, function () {
            return void _this25.restartConfirmed();
          });
          this.button('menu', '回菜单', 160, 510, 430, 96, function () {
            var _this25$engine, _this25$world;
            _this25.screen = 'MENU';
            (_this25$engine = _this25.engine) == null || _this25$engine.dispose();
            _this25.engine = null;
            _this25.clock = null;
            (_this25$world = _this25.world) == null || _this25$world.destroy();
            _this25.render();
          });
          if (!this.resultSaved && this.activeSaveRepository()) this.button('retry-save', '重试保存', 160, 370, 430, 96, function () {
            return void _this25.retryResultSave();
          });
        };
        _proto.renderError = function renderError() {
          var _this$labels$get3,
            _this26 = this;
          var physics = this.notice.includes('PHYSICS_');
          this.themePanel('ui_panel_modal', 375, 780, 670, 850, true);
          this.themeSprite('ui_icon_warning', 375, 1130, 80, 80);
          this.text('error', physics ? '本局暂时遇到问题' : '暂时无法开始', 375, 990, 40);
          this.text('error-detail', physics ? this.notice : /图片|加载/.test(this.notice) ? '图片暂时没加载完成，请点击重试。\n已有存档会保留。' : this.notice || '请重试或重新打开游戏。', 375, 860, 26);
          (_this$labels$get3 = this.labels.get('error-detail')) == null || (_this$labels$get3 = _this$labels$get3.node.getComponent(UITransform)) == null || _this$labels$get3.setContentSize(560, 150);
          if (physics) {
            if (this.engine && this.recoveryUsedRunId !== this.engine.snapshot().runId && (this.engine.recoveryCheckpoint || this.activeSaveRepository())) this.button('retry-checkpoint', '恢复本局', 160, 650, 430, 96, function () {
              return void _this26.retryTechnicalRecovery();
            });
            this.button('error-menu', '返回菜单', 160, 510, 430, 96, function () {
              var _this26$engine, _this26$world;
              _this26.screen = 'MENU';
              (_this26$engine = _this26.engine) == null || _this26$engine.dispose();
              _this26.engine = null;
              _this26.clock = null;
              (_this26$world = _this26.world) == null || _this26$world.destroy();
              _this26.render();
            });
            this.button('physics-details', '查看错误详情', 160, 390, 430, 72, function () {
              _this26.showPhysicsDiagnostics = !_this26.showPhysicsDiagnostics;
              _this26.render();
            });
            if (this.showPhysicsDiagnostics) {
              var _this$engine$lastTick2, _this$engine24, _this$labels$get4;
              var fault = ((_this$engine$lastTick2 = (_this$engine24 = this.engine) == null ? void 0 : _this$engine24.lastTickFault) != null ? _this$engine$lastTick2 : '无可用错误摘要').slice(0, 240);
              this.text('physics-diagnostic', "\u6784\u5EFA " + AppRuntime.buildId + "\n" + fault, 375, 290, 18);
              (_this$labels$get4 = this.labels.get('physics-diagnostic')) == null || (_this$labels$get4 = _this$labels$get4.node.getComponent(UITransform)) == null || _this$labels$get4.setContentSize(560, 140);
            }
            return;
          }
          this.button('retry-load', '重试资源加载', 160, 680, 430, 96, function () {
            return void _this26.retryArtAndStart();
          });
          if (this.artReady) this.button('memory-new', '仅内存新局', 160, 540, 430, 96, function () {
            return void _this26.startNew(true);
          });
        };
        _proto.retryTechnicalRecovery = /*#__PURE__*/function () {
          var _retryTechnicalRecovery = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee21() {
            var _this$engine25,
              _this27 = this;
            var failedRunId, owner, _this$engine$recovery, _this$engine26, _this$engine27, snapshot, repository, _saved$payload$run, loaded, saved, checked, adapter, engine, _this$clock13;
            return _regeneratorRuntime().wrap(function _callee21$(_context21) {
              while (1) switch (_context21.prev = _context21.next) {
                case 0:
                  failedRunId = (_this$engine25 = this.engine) == null ? void 0 : _this$engine25.snapshot().runId;
                  if (!(!failedRunId || this.recoveryUsedRunId === failedRunId)) {
                    _context21.next = 3;
                    break;
                  }
                  return _context21.abrupt("return");
                case 3:
                  if (!this.loading) {
                    _context21.next = 5;
                    break;
                  }
                  return _context21.abrupt("return");
                case 5:
                  this.loading = true;
                  owner = this.ownerEpoch;
                  _context21.prev = 7;
                case 8:
                  if (!this.saveInFlight) {
                    _context21.next = 13;
                    break;
                  }
                  _context21.next = 11;
                  return this.waitForSaveIdle();
                case 11:
                  _context21.next = 8;
                  break;
                case 13:
                  if (!(!this.isOwner() || owner !== this.ownerEpoch)) {
                    _context21.next = 15;
                    break;
                  }
                  return _context21.abrupt("return");
                case 15:
                  snapshot = (_this$engine$recovery = (_this$engine26 = this.engine) == null ? void 0 : _this$engine26.recoveryCheckpoint) != null ? _this$engine$recovery : null;
                  if (snapshot) {
                    _context21.next = 26;
                    break;
                  }
                  repository = this.activeSaveRepository();
                  if (!repository) {
                    _context21.next = 26;
                    break;
                  }
                  _context21.next = 21;
                  return repository.readBundle();
                case 21:
                  loaded = _context21.sent;
                  if (!(!this.isOwner() || owner !== this.ownerEpoch)) {
                    _context21.next = 24;
                    break;
                  }
                  return _context21.abrupt("return");
                case 24:
                  saved = loaded.ok ? loaded.data.envelope : null;
                  if ((saved == null || (_saved$payload$run = saved.payload.run) == null ? void 0 : _saved$payload$run.runId) === failedRunId) {
                    snapshot = saved.payload.run;
                    this.bundle = saved.payload;
                    this.bundleRevision = saved.revision;
                  }
                case 26:
                  if (!(!snapshot || snapshot.runId !== failedRunId)) {
                    _context21.next = 30;
                    break;
                  }
                  this.notice = '本次页面内没有可恢复的完整局面，请返回菜单重新开始。错误编号 PHYSICS_CHECKPOINT_UNAVAILABLE';
                  this.render();
                  return _context21.abrupt("return");
                case 30:
                  snapshot = SaveCodec.sealSnapshot(snapshot);
                  checked = SaveValidator.snapshot(snapshot);
                  if (checked.valid) {
                    _context21.next = 34;
                    break;
                  }
                  throw new Error("CHECKPOINT_INVALID:" + checked.code);
                case 34:
                  (_this$engine27 = this.engine) == null || _this$engine27.dispose();
                  this.engine = null;
                  this.adapter = null;
                  adapter = this.createWorld();
                  _context21.prev = 38;
                  engine = new RunEngine(adapter, AppRuntime.rules, snapshot.runId, snapshot.rng.state, snapshot, this.reviveOptions());
                  _context21.next = 46;
                  break;
                case 42:
                  _context21.prev = 42;
                  _context21.t0 = _context21["catch"](38);
                  adapter.dispose();
                  throw _context21.t0;
                case 46:
                  this.adapter = adapter;
                  this.engine = engine;
                  this.baseTick = snapshot.tick;
                  this.clock = new FixedClock(AppRuntime.rules.physics.fixed_hz, AppRuntime.rules.physics.max_catchup_steps, function () {
                    return _this27.advanceRunTick();
                  });
                  this.clock.pause();
                  this.bundle = _extends({}, this.bundle, {
                    profile: _extends({}, this.bundle.profile, {
                      activeRunId: failedRunId
                    }),
                    run: engine.snapshot()
                  });
                  this.recoveryUsedRunId = failedRunId;
                  this.pauseOwners.clear();
                  this.bindRewardedShake();
                  this.bindSpillRevive();
                  this.screen = engine.spillPending ? 'REVIVE' : 'PAUSED';
                  this.notice = engine.spillPending ? '已恢复洒出局面：可观看广告复活一次，或结束本局。' : '已恢复本页最近完整局面；点击“继续游戏”后再操作。';
                  this.render();
                  _context21.next = 67;
                  break;
                case 61:
                  _context21.prev = 61;
                  _context21.t1 = _context21["catch"](7);
                  (_this$clock13 = this.clock) == null || _this$clock13.pause();
                  this.screen = 'ERROR';
                  this.notice = "\u6062\u590D\u672A\u5B8C\u6210\uFF0C\u8BF7\u8FD4\u56DE\u83DC\u5355\uFF1B\u5DF2\u6709\u5B58\u6863\u672A\u8986\u76D6\u3002\u9519\u8BEF\u7F16\u53F7 PHYSICS_RECOVERY_FAILED " + String(_context21.t1).slice(0, 120);
                  this.render();
                case 67:
                  _context21.prev = 67;
                  if (this.isOwner() && owner === this.ownerEpoch) this.loading = false;
                  return _context21.finish(67);
                case 70:
                case "end":
                  return _context21.stop();
              }
            }, _callee21, this, [[7, 61, 67, 70], [38, 42]]);
          }));
          function retryTechnicalRecovery() {
            return _retryTechnicalRecovery.apply(this, arguments);
          }
          return retryTechnicalRecovery;
        }();
        _proto.drawButtons = function drawButtons() {
          for (var _iterator13 = _createForOfIteratorHelperLoose(this.buttons), _step13; !(_step13 = _iterator13()).done;) {
            var b = _step13.value;
            var n = new Node("P1BButton-" + b.id);
            this.uiRoot.addChild(n);
            n.setPosition(b.rect.x - 375 + b.rect.w / 2, b.rect.y - 667 + b.rect.h / 2, 0);
            n.addComponent(UITransform).setContentSize(b.rect.w, b.rect.h);
            var primary = ['new', 'continue', 'resume', 'yes', 'again', 'tutorial-next', 'drop'].includes(b.id),
              circle = b.rect.w <= 110,
              family = circle ? 'icon' : primary ? 'primary' : 'secondary',
              skin = "ui_btn_" + family + "_" + (b.enabled === false ? 'disabled' : 'normal');
            if (this.art.getLoadedVariant(skin)) {
              var image = this.art.createSprite(n, skin, b.rect.w, b.rect.h, true);
              image.name = 'ButtonSkin';
              this.buttonSkins.set(b.id, {
                node: image,
                family: family
              });
            } else {
              var g = n.addComponent(Graphics);
              g.fillColor = new Color(255, 207, 75);
              g.roundRect(-b.rect.w / 2, -b.rect.h / 2, b.rect.w, b.rect.h, 24);
              g.fill();
            }
            var icons = {
              "new": 'play',
              "continue": 'continue',
              resume: 'continue',
              settings: 'settings',
              restart: 'restart',
              again: 'restart',
              menu: 'home',
              pause: 'pause',
              shake: 'shake',
              back: 'back',
              yes: 'check',
              no: 'close',
              motion: 'reduced_motion',
              'tutorial-replay': 'info'
            };
            var icon = icons[b.id];
            if (icon && !circle && this.art.getLoadedVariant('ui_icon_' + icon)) {
              var _image = this.art.createSprite(n, 'ui_icon_' + icon, 38, 38, true);
              _image.setPosition(-b.rect.w / 2 + 43, 0, 0);
            }
            var lnode = new Node('Label');
            n.addChild(lnode);
            lnode.addComponent(UITransform).setContentSize(b.rect.w - (icon ? 78 : 20), b.rect.h - 12);
            lnode.setPosition(icon ? 19 : 0, 0, 0);
            var l = lnode.addComponent(Label);
            l.string = b.label;
            l.fontSize = circle ? 34 : 28;
            l.lineHeight = 34;
            l.color = new Color(103, 58, 32);
            l.isBold = true;
            l.overflow = Label.Overflow.SHRINK;
            l.enableWrapText = true;
          }
        };
        _proto.text = function text(id, value, x, y, size, color) {
          if (color === void 0) {
            color = new Color(66, 48, 38);
          }
          var n = new Node("P1BText-" + id);
          this.uiRoot.addChild(n);
          n.setPosition(x - 375, y - 667, 0);
          n.addComponent(UITransform).setContentSize(700, 60);
          var label = n.addComponent(Label);
          label.string = value;
          label.fontSize = size;
          label.lineHeight = size + 8;
          label.color = color;
          label.isBold = true;
          label.overflow = Label.Overflow.SHRINK;
          label.enableWrapText = true;
          this.labels.set(id, label);
        };
        _proto.button = function button(id, label, x, y, w, h, action) {
          this.buttons.push({
            id: id,
            label: label,
            rect: {
              x: x,
              y: y,
              w: w,
              h: h
            },
            action: action
          });
        };
        _proto.refreshHud = function refreshHud() {
          var _this$engine28, _this$bundle$profile$15, _this$bundle$profile$16, _this$rewarded4, _this$rewardView3, _this$uiRoot5;
          if (this.screen !== 'PLAYING') return;
          var snap = (_this$engine28 = this.engine) == null ? void 0 : _this$engine28.snapshot();
          if (!snap) return;
          var score = this.labels.get('score'),
            next = this.labels.get('next'),
            danger = this.labels.get('danger');
          var bucket = snap.boardType === 'assisted' ? 'assisted' : 'standard';
          if (score) score.string = "\u5206\u6570 " + snap.score + "  \xB7  \u7EAA\u5F55 " + ((_this$bundle$profile$15 = (_this$bundle$profile$16 = this.bundle.profile.bestScoresByRules) == null || (_this$bundle$profile$16 = _this$bundle$profile$16[snap.rulesVersion]) == null || (_this$bundle$profile$16 = _this$bundle$profile$16.classic) == null ? void 0 : _this$bundle$profile$16[bucket]) != null ? _this$bundle$profile$15 : 0);
          if (next) next.string = "\u5F53\u524D " + this.levelName(snap.currentLevel) + "  \xB7  \u6700\u9AD8 " + this.levelName(snap.maxLevel);
          if (danger) danger.string = snap.dangerTicks ? "\u5FEB\u6EE1\u4E86 \xB7 " + Math.max(1, 3 - Math.floor(snap.dangerTicks / 60)) : '同级相遇，合成更大颗';
          var durationTicks = Math.round(AppRuntime.rules.shake.duration_seconds * AppRuntime.rules.physics.fixed_hz),
            shakeLeft = Math.max(0, 2 - snap.shake.baseUsed),
            extraLeft = Math.max(0, snap.shake.extraGranted - snap.shake.extraUsed),
            activeLeft = snap.shake.activeStartTick === null ? 0 : Math.max(0, snap.shake.activeStartTick + durationTicks - snap.tick),
            cooldownLeft = Math.max(0, snap.shake.cooldownUntilTick - snap.tick);
          var shakeLabel = activeLeft > 0 ? '晃杯中' : cooldownLeft > 0 ? '稍等片刻' : shakeLeft > 0 ? "\u6643\u676F " + shakeLeft : extraLeft > 0 ? "\u5956\u52B1\u6643\u676F " + extraLeft : (_this$rewarded4 = this.rewarded) != null && _this$rewarded4.policy.enabled && ((_this$rewardView3 = this.rewardView()) == null ? void 0 : _this$rewardView3.block) === null ? '看广告 +1 次' : '本局次数已用完';
          var button = (_this$uiRoot5 = this.uiRoot) == null || (_this$uiRoot5 = _this$uiRoot5.getChildByName('P1BButton-shake')) == null || (_this$uiRoot5 = _this$uiRoot5.getChildByName('Label')) == null ? void 0 : _this$uiRoot5.getComponent(Label);
          if (button) button.string = shakeLabel;
        };
        _proto.enqueue = function enqueue(kind, x) {
          if (!this.engine || this.screen !== 'PLAYING') return;
          var snap = this.engine.snapshot();
          if (kind === 'SHAKE' && snap.shake.baseUsed >= 2 && Math.max(0, snap.shake.extraGranted - snap.shake.extraUsed) === 0) {
            this.openRewardedOffer();
            return;
          }
          var commandId = this.makeUuid();
          var command = {
            kind: kind,
            runId: snap.runId,
            commandId: commandId,
            sequence: snap.nextCommandSequence,
            tick: snap.tick + 1
          };
          if (kind === 'DROP') command.xDu = x != null ? x : this.previewX;else command.source = snap.shake.baseUsed < 2 ? 'base' : 'rewarded_ad';
          var result = this.engine.dispatch({
            command: command,
            ownerEpoch: snap.epoch
          });
          if (!result.ok) {
            this.notice = result.error.message;
            this.render();
            return;
          }
          if (this.probeMode() === 'full') this.commands.append(command);
        };
        _proto.onTouchStart = function onTouchStart(event) {
          var _event$getID;
          this.ignoreMouseUntil = Date.now() + 600;
          this.beginPointer(event, (_event$getID = event.getID == null ? void 0 : event.getID()) != null ? _event$getID : 0);
        };
        _proto.onTouchMove = function onTouchMove(event) {
          var _event$getID2;
          this.updatePressedState(event);
          if (this.pointerKind === 'cup' && this.primaryPointer === ((_event$getID2 = event.getID == null ? void 0 : event.getID()) != null ? _event$getID2 : 0)) this.moveCup(event);
        };
        _proto.onTouchEnd = function onTouchEnd(event) {
          var _event$getID3;
          if (this.primaryPointer === ((_event$getID3 = event.getID == null ? void 0 : event.getID()) != null ? _event$getID3 : 0)) this.endPointer(event);
        };
        _proto.onTouchCancel = function onTouchCancel(event) {
          var _event$getID4;
          if (this.primaryPointer === ((_event$getID4 = event.getID == null ? void 0 : event.getID()) != null ? _event$getID4 : 0)) this.cancelPointer();
        };
        _proto.onMouseDown = function onMouseDown(event) {
          if (Date.now() < this.ignoreMouseUntil) return;
          this.beginPointer(event, -1);
        };
        _proto.onMouseMove = function onMouseMove(event) {
          if (Date.now() < this.ignoreMouseUntil) return;
          this.updatePressedState(event);
          if (this.pointerKind === 'cup' && this.primaryPointer === -1) this.moveCup(event);
        };
        _proto.onMouseUp = function onMouseUp(event) {
          if (Date.now() < this.ignoreMouseUntil) return;
          if (this.primaryPointer === -1) this.endPointer(event);
        };
        _proto.updatePressedState = function updatePressedState(event) {
          var _this28 = this;
          if (this.pointerKind !== 'ui' || !this.startedInButton) return;
          var b = this.buttons.find(function (v) {
              return v.id === _this28.startedInButton;
            }),
            p = this.point(event);
          if (b) this.setButtonState(b.id, this.contains(b.rect, p.x, p.y) ? 'pressed' : 'normal');
        };
        _proto.inDropBand = function inDropBand(p) {
          return p.x >= 80 && p.x <= 670 && p.y >= 180 && p.y <= 320;
        };
        _proto.beginPointer = function beginPointer(event, id) {
          var _this29 = this;
          if (this.primaryPointer !== null) return;
          var p = this.point(event);
          var hit = this.buttons.find(function (b) {
            return _this29.contains(b.rect, p.x, p.y);
          });
          this.primaryPointer = id;
          if (hit) {
            var _this$effects12;
            this.pointerKind = 'ui';
            this.startedInButton = hit.id;
            void ((_this$effects12 = this.effects) == null ? void 0 : _this$effects12.play('tap', p.x, p.y, "button:" + hit.id, this.reducedMotion));
            if (hit.enabled !== false) this.setButtonState(hit.id, 'pressed');
            return;
          }
          if (this.screen === 'PLAYING' && this.hitCup(p)) {
            this.pointerKind = 'cup';
            var snap = this.engine.snapshot();
            this.cupPointerStartX = p.x;
            this.cupPointerStartOffset = snap.cupMotion.offsetXDu;
            return;
          }
          this.pointerKind = 'ui';
          this.startedInButton = null;
        };
        _proto.hitCup = function hitCup(p) {
          var _this$engine$snapshot, _this$engine29;
          var cup = AppRuntime.rules.cup,
            cx = cup.center_x_du + ((_this$engine$snapshot = (_this$engine29 = this.engine) == null ? void 0 : _this$engine29.snapshot().cupMotion.offsetXDu) != null ? _this$engine$snapshot : 0),
            x = Math.abs(p.x - cx);
          if (p.y >= 180 && p.y <= 340) return x <= cup.bottom_width_du / 2 + 16;
          if (p.y < 360 || p.y > 720) return false;
          var half = cup.bottom_width_du / 2 + (p.y - 360) * (cup.top_width_du - cup.bottom_width_du) / (2 * 640);
          return x <= half + 16;
        };
        _proto.moveCup = function moveCup(event) {
          var _this$engine30, _AppRuntime$rules$cup, _AppRuntime$rules9;
          var p = this.point(event);
          (_this$engine30 = this.engine) == null || _this$engine30.setCupTarget(this.cupPointerStartOffset + (p.x - this.cupPointerStartX) * ((_AppRuntime$rules$cup = (_AppRuntime$rules9 = AppRuntime.rules) == null ? void 0 : _AppRuntime$rules9.cup_motion.input_gain) != null ? _AppRuntime$rules$cup : 1));
        };
        _proto.moveDrop = function moveDrop(event) {
          var p = this.point(event);
          if (this.inDropBand(p)) {
            this.previewX = this.clampPreview(this.dropStartPreviewX + (p.x - this.dropStartX) * 2);
            this.updatePreviewPosition();
          }
        };
        _proto.endPointer = function endPointer(event) {
          var _this30 = this;
          var p = this.point(event);
          if (this.pointerKind === 'ui' && this.startedInButton) {
            var hit = this.buttons.find(function (b) {
              return b.id === _this30.startedInButton && _this30.contains(b.rect, p.x, p.y);
            });
            this.setButtonState(this.startedInButton, 'normal');
            if (hit && hit.enabled !== false) {
              var _this$audio14;
              this.unlockAudioFromGesture();
              (_this$audio14 = this.audio) == null || _this$audio14.play('ui_tap');
              hit.action();
            }
          } else if (this.pointerKind === 'cup' && this.screen === 'PLAYING') {
            var _this$engine31;
            this.moveCup(event);
            (_this$engine31 = this.engine) == null || _this$engine31.releaseCup();
            this.unlockAudioFromGesture();
          } else if (this.pointerKind === 'drop' && this.screen === 'PLAYING' && this.inDropBand(p)) {
            var overUi = this.buttons.some(function (b) {
              return _this30.contains(b.rect, p.x, p.y);
            });
            if (!overUi) {
              this.previewX = this.clampPreview(this.dropStartPreviewX + (p.x - this.dropStartX) * 2);
              this.updatePreviewPosition();
              this.unlockAudioFromGesture();
              if (this.mode === 'drag_release') this.enqueue('DROP', this.previewX);
            }
          }
          this.primaryPointer = null;
          this.pointerKind = null;
          this.startedInButton = null;
        };
        _proto.cancelPointer = function cancelPointer() {
          var _this$engine32;
          if (this.startedInButton) this.setButtonState(this.startedInButton, 'normal');
          if (this.pointerKind === 'cup') (_this$engine32 = this.engine) == null || _this$engine32.cancelCupInput(false);
          this.primaryPointer = null;
          this.pointerKind = null;
          this.startedInButton = null;
          this.dropStartX = 0;
          this.dropStartPreviewX = this.previewX;
        };
        _proto.point = function point(event) {
          var _ref9, _event$getUILocation;
          // getUILocation() already removes the pixel scale. Only remove the centered
          // decorative margins; do not apply UITransform or a second scale conversion.
          var loc = (_ref9 = (_event$getUILocation = event.getUILocation == null ? void 0 : event.getUILocation()) != null ? _event$getUILocation : event.getLocation == null ? void 0 : event.getLocation()) != null ? _ref9 : new Vec2();
          return gameUiPoint(loc, AppRuntime.rules.viewport);
        };
        _proto.contains = function contains(r, x, y) {
          return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
        };
        _proto.clampPreview = function clampPreview(x) {
          var _ingredients$find$rad,
            _ingredients$find,
            _this31 = this;
          var r = (_ingredients$find$rad = (_ingredients$find = AppRuntime.rules.ingredients.find(function (i) {
            var _this31$engine;
            return i.level === ((_this31$engine = _this31.engine) == null ? void 0 : _this31$engine.snapshot().currentLevel);
          })) == null ? void 0 : _ingredients$find.radius_du) != null ? _ingredients$find$rad : 18;
          var cup = AppRuntime.rules.cup;
          return Math.max(cup.center_x_du - cup.top_width_du / 2 + r, Math.min(cup.center_x_du + cup.top_width_du / 2 - r, x));
        };
        _proto.restoreRun = /*#__PURE__*/function () {
          var _restoreRun = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee22() {
            var _ref10,
              _this$bundle$profile$17,
              _this$bundle$profile$18,
              _this$bundle$profile$19,
              _AppRuntime$rules10,
              _this32 = this;
            var owner, stored, rules, run;
            return _regeneratorRuntime().wrap(function _callee22$(_context22) {
              while (1) switch (_context22.prev = _context22.next) {
                case 0:
                  if (!(this.loading || !this.bundle.run)) {
                    _context22.next = 2;
                    break;
                  }
                  return _context22.abrupt("return");
                case 2:
                  this.runBestScoreAtStart = (_ref10 = (_this$bundle$profile$17 = (_this$bundle$profile$18 = this.bundle.profile.bestScoresByRules) == null || (_this$bundle$profile$18 = _this$bundle$profile$18[this.bundle.run.rulesVersion]) == null || (_this$bundle$profile$18 = _this$bundle$profile$18.classic) == null ? void 0 : _this$bundle$profile$18.standard) != null ? _this$bundle$profile$17 : (_this$bundle$profile$19 = this.bundle.profile.bestScores[this.bundle.run.stageId]) == null ? void 0 : _this$bundle$profile$19.standard) != null ? _ref10 : 0;
                  if (!(this.bundle.run.rulesVersion !== ((_AppRuntime$rules10 = AppRuntime.rules) == null ? void 0 : _AppRuntime$rules10.design_rules_version))) {
                    _context22.next = 7;
                    break;
                  }
                  this.notice = '这是旧杯型的未完成局，已保留但不会载入新杯。确认开始新杯后才替换。';
                  this.render();
                  return _context22.abrupt("return");
                case 7:
                  this.loading = true;
                  this.screen = 'PAUSED';
                  this.render();
                  owner = ++this.ownerEpoch;
                  _context22.prev = 11;
                  _context22.next = 14;
                  return this.repo.readBundle();
                case 14:
                  stored = _context22.sent;
                  if (!(!this.isOwner() || owner !== this.ownerEpoch)) {
                    _context22.next = 17;
                    break;
                  }
                  return _context22.abrupt("return");
                case 17:
                  if (stored.ok) {
                    _context22.next = 19;
                    break;
                  }
                  throw new Error(stored.error.message);
                case 19:
                  if (stored.data.envelope) {
                    _context22.next = 21;
                    break;
                  }
                  throw new Error('没有可续局档案');
                case 21:
                  this.bundle = stored.data.envelope.payload;
                  this.bundleRevision = stored.data.envelope.revision;
                  _context22.next = 25;
                  return this.loadGameArt();
                case 25:
                  if (!(!this.isOwner() || owner !== this.ownerEpoch)) {
                    _context22.next = 27;
                    break;
                  }
                  return _context22.abrupt("return");
                case 27:
                  rules = AppRuntime.rules;
                  run = this.bundle.run;
                  this.adapter = this.createWorld();
                  this.engine = new RunEngine(this.adapter, rules, run.runId, run.rng.state, run, this.reviveOptions());
                  this.engine.setTimingDiagnostics(this.probeMode() !== 'off');
                  this.baseTick = run.tick;
                  this.clock = new FixedClock(rules.physics.fixed_hz, rules.physics.max_catchup_steps, function () {
                    return _this32.advanceRunTick();
                  });
                  this.clock.pause();
                  this.pauseOwners = new Set(['RESTORING']);
                  this.pauseOwners["delete"]('RESTORING');
                  if (HostLifecycleCoordinator.snapshot().resumeRequired) this.pauseOwners.add('RESUME_REQUIRED');
                  this.screen = this.engine.spillPending ? 'REVIVE' : 'PAUSED';
                  this.notice = this.engine.spillPending ? '已恢复洒出局面：可观看广告复活一次，或结束本局。' : '已从最近完整保存恢复；点击“继续”后才推进。';
                  this.bindRewardedShake();
                  this.bindSpillRevive();
                  this.render();
                  _context22.next = 48;
                  break;
                case 45:
                  _context22.prev = 45;
                  _context22.t0 = _context22["catch"](11);
                  if (this.isOwner() && owner === this.ownerEpoch) {
                    this.screen = 'ERROR';
                    this.notice = "\u7EED\u5C40\u5931\u8D25\uFF1A" + String(_context22.t0);
                    this.render();
                  }
                case 48:
                  _context22.prev = 48;
                  if (this.isOwner() && owner === this.ownerEpoch) this.loading = false;
                  return _context22.finish(48);
                case 51:
                case "end":
                  return _context22.stop();
              }
            }, _callee22, this, [[11, 45, 48, 51]]);
          }));
          function restoreRun() {
            return _restoreRun.apply(this, arguments);
          }
          return restoreRun;
        }();
        _proto.persistSettings = /*#__PURE__*/function () {
          var _persistSettings = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee23() {
            var _this$bundle$run$runI4, _this$bundle$run4;
            var repository, task, owner, expectedRevision, expectedRunId, profile, next, r;
            return _regeneratorRuntime().wrap(function _callee23$(_context23) {
              while (1) switch (_context23.prev = _context23.next) {
                case 0:
                  repository = this.activeSaveRepository();
                  if (repository) {
                    _context23.next = 4;
                    break;
                  }
                  this.notice = '设置仅保存在当前页面内存中。';
                  return _context23.abrupt("return");
                case 4:
                  if (!this.saveInFlight) {
                    _context23.next = 7;
                    break;
                  }
                  this.settingsDirty = true;
                  return _context23.abrupt("return");
                case 7:
                  task = this.beginSaveTask();
                  if (!(task === null)) {
                    _context23.next = 11;
                    break;
                  }
                  this.settingsDirty = true;
                  return _context23.abrupt("return");
                case 11:
                  owner = this.ownerEpoch, expectedRevision = this.bundleRevision, expectedRunId = (_this$bundle$run$runI4 = (_this$bundle$run4 = this.bundle.run) == null ? void 0 : _this$bundle$run4.runId) != null ? _this$bundle$run$runI4 : null;
                  profile = _extends({}, this.bundle.profile, {
                    settings: _extends({}, this.bundle.profile.settings, {
                      dropMode: this.mode,
                      reducedMotion: this.reducedMotion
                    }),
                    revision: this.bundle.profile.revision + 1
                  });
                  next = _extends({}, this.bundle, {
                    profile: profile
                  });
                  _context23.prev = 14;
                  _context23.next = 17;
                  return repository.commitBundle(expectedRevision, expectedRunId, next);
                case 17:
                  r = _context23.sent;
                  if (this.ownsSaveTask(task, owner)) {
                    _context23.next = 20;
                    break;
                  }
                  return _context23.abrupt("return");
                case 20:
                  if (r.ok) {
                    this.bundle = next;
                    this.bundleRevision = r.data.revision;
                  } else {
                    this.notice = "\u8BBE\u7F6E\u672A\u4FDD\u5B58\uFF1A" + r.error.message;
                  }
                  _context23.next = 26;
                  break;
                case 23:
                  _context23.prev = 23;
                  _context23.t0 = _context23["catch"](14);
                  if (this.ownsSaveTask(task, owner)) this.notice = "\u8BBE\u7F6E\u672A\u4FDD\u5B58\uFF1A" + String(_context23.t0);
                case 26:
                  _context23.prev = 26;
                  if (this.ownsSaveTask(task, owner) && this.screen !== 'PLAYING') this.render();
                  this.finishSaveTask(task);
                  return _context23.finish(26);
                case 30:
                case "end":
                  return _context23.stop();
              }
            }, _callee23, this, [[14, 23, 26, 30]]);
          }));
          function persistSettings() {
            return _persistSettings.apply(this, arguments);
          }
          return persistSettings;
        }();
        _proto.makeFixtureSnapshot = function makeFixtureSnapshot(base, fixtureId, options) {
          var _options$level;
          var rules = AppRuntime.rules,
            allowedOptions = new Set(['level', 'xDu', 'contactOrder']);
          if (fixtureId === 'shake-sample') allowedOptions.add('sampleIndex');
          if (['danger-supported-continuous', 'danger-supported-continuous-shortcup', 'danger-reset', 'grace', 'danger-line', 'danger-alternate', 'merge-before-danger', 'merge-danger-inherit', 'danger-during-shake', 'entered', 'spill-never-entered', 'spill-return', 'spill-child', 'terminal-priority', 'side-escape', 'settlement-retry', 'restart-confirm', 'shake-cooldown', 'shake-drop', 'shake-pause'].includes(fixtureId)) {
            allowedOptions.add('tick');
            allowedOptions.add('dangerTicks');
          }
          for (var _i6 = 0, _Object$keys = Object.keys(options); _i6 < _Object$keys.length; _i6++) {
            var key = _Object$keys[_i6];
            if (!allowedOptions.has(key)) throw new Error("FIXTURE_OPTION_NOT_ALLOWED:" + key);
          }
          var levelValue = (_options$level = options.level) != null ? _options$level : 1;
          if (!Number.isSafeInteger(levelValue) || Number(levelValue) < 1 || Number(levelValue) > 9) throw new Error('FIXTURE_LEVEL_INVALID');
          if (fixtureId !== 'tie-order' && 'contactOrder' in options) throw new Error('CONTACT_ORDER_ONLY_VALID_FOR_TIE_ORDER');
          var level = Number(levelValue),
            states = [];
          var tick = 0,
            dangerTicks = 0,
            pattern,
            geometry = {},
            shake = base.shake;
          var definition = function definition(n) {
            var item = rules.ingredients.find(function (v) {
              return v.level === n;
            });
            if (!item) throw new Error("FIXTURE_LEVEL_MISSING:" + n);
            return item;
          };
          var add = function add(entityId, n, x, y, flags) {
            if (flags === void 0) {
              flags = {};
            }
            var item = definition(n);
            states.push(_extends({
              entityId: entityId,
              level: n,
              positionDu: {
                x: x,
                y: y
              },
              velocityDuPerSecond: {
                x: 0,
                y: 0
              },
              angleRadians: 0,
              angularVelocity: 0,
              bornTick: 0,
              dangerEligible: false,
              hasEnteredCup: false,
              spillTicks: 0,
              sleeping: false
            }, flags));
          };
          var center = rules.cup.center_x_du,
            floor = rules.cup.inner_bottom_y_du + 90;
          var pair = function pair(a, b, y, offset) {
            if (y === void 0) {
              y = floor;
            }
            if (offset === void 0) {
              offset = 0;
            }
            var ra = definition(a).radius_du,
              rb = definition(b).radius_du;
            var d = (ra + rb) * .94;
            add(states.length + 1, a, center + offset - d / 2, y);
            add(states.length + 1, b, center + offset + d / 2, y);
          };
          switch (fixtureId) {
            case 'empty':
            case 'shake-empty':
            case 'initial-preview':
            case 'control-pump':
            case 'control-preempt':
            case 'clock-restore':
              pattern = 'empty';
              break;
            case 'restart-confirm':
              pattern = 'empty-paused-run-entry-for-trusted-restart-cancel-and-confirm-transaction';
              break;
            case 'score-replay':
            case 'five-substeps':
            case 'uuid':
              pair(1, 1);
              tick = 1;
              pattern = fixtureId === 'score-replay' ? 'real-contact-pair-for-sealed-merge-event-replay-idempotency' : fixtureId === 'five-substeps' ? 'real-contact-pair-for-first-substep-merge-and-next-substep-parent-disposal' : 'real-contact-pair-for-stable-domain-event-uuid-derivation';
              break;
            case 'view-only':
              {
                var r = definition(1).radius_du,
                  y = rules.cup.inner_bottom_y_du + r + 150;
                add(1, 1, center, y, {
                  dangerEligible: true,
                  hasEnteredCup: true
                });
                pattern = 'single-real-body-for-comparing-reduced-motion-with-domain-and-force-unchanged';
                geometry = {
                  entityId: 1,
                  radiusDu: r,
                  centerDu: {
                    x: center,
                    y: y
                  },
                  initialReducedMotion: this.reducedMotion
                };
                break;
              }
            case 'settlement-retry':
              {
                var _options$tick;
                var _r = definition(1).radius_du,
                  _y = rules.cup.inner_top_y_du + _r + 20;
                tick = Number((_options$tick = options.tick) != null ? _options$tick : 29);
                add(1, 1, center, _y, {
                  bornTick: 0,
                  dangerEligible: true,
                  hasEnteredCup: true,
                  spillTicks: 29
                });
                pattern = 'real-terminal-ready-entered-body-for-three-commit-faults-and-fourth-retry';
                geometry = {
                  entityId: 1,
                  spillTicks: 29,
                  topYDu: rules.cup.inner_top_y_du,
                  expectedFaultCount: 3
                };
                break;
              }
            case 'shake-sample':
              {
                var j = options.sampleIndex,
                  _r2 = definition(1).radius_du,
                  _y2 = rules.cup.inner_bottom_y_du + (rules.cup.inner_top_y_du - rules.cup.inner_bottom_y_du) * .72;
                if (!Number.isSafeInteger(j) || Number(j) < 0 || Number(j) > 48) throw new Error('SHAKE_SAMPLE_INDEX_INVALID');
                if (_y2 - _r2 <= rules.cup.inner_bottom_y_du || _y2 + _r2 >= rules.cup.inner_top_y_du || Math.abs(center - rules.cup.center_x_du) + _r2 >= rules.cup.top_width_du / 2) throw new Error('SHAKE_SAMPLE_BODY_NOT_FINITE_CUP_INTERIOR');
                add(1, 1, center, _y2, {
                  hasEnteredCup: true,
                  dangerEligible: true
                });
                tick = 0;
                pattern = 'single-real-level1-body-inside-finite-cup-starting-with-no-shake-for-trusted-player-command';
                geometry = {
                  sampleIndex: Number(j),
                  entityId: 1,
                  bodyCenterDu: {
                    x: center,
                    y: _y2
                  },
                  radiusDu: _r2,
                  bottomClearanceDu: _y2 - _r2 - rules.cup.inner_bottom_y_du,
                  topClearanceDu: rules.cup.inner_top_y_du - _y2 - _r2,
                  expectedSamplesThroughIndex: Number(j),
                  initialShake: _extends({}, base.shake),
                  cup: {
                    centerXDu: center,
                    bottomYDu: rules.cup.inner_bottom_y_du,
                    topYDu: rules.cup.inner_top_y_du,
                    bottomWidthDu: rules.cup.bottom_width_du,
                    topWidthDu: rules.cup.top_width_du
                  }
                };
                break;
              }
            case 'shake-two':
            case 'shake-child':
              pair(1, 1);
              pattern = fixtureId === 'shake-child' ? 'two-real-parents-with-shake-active-for-next-step' : 'two-real-touching-level1-bodies';
              if (fixtureId === 'shake-child') {
                tick = 1;
                shake = _extends({}, shake, {
                  baseUsed: 1,
                  activeStartTick: 1,
                  cooldownUntilTick: 79
                });
              }
              break;
            case 'shake-rapid':
              {
                var _r3 = definition(1).radius_du,
                  _y3 = rules.cup.inner_bottom_y_du + 150;
                add(1, 1, center, _y3, {
                  dangerEligible: true,
                  hasEnteredCup: true
                });
                pattern = 'single-no-contact-real-body-for-repeated-trusted-shake-input';
                geometry = {
                  entityId: 1,
                  radiusDu: _r3,
                  centerDu: {
                    x: center,
                    y: _y3
                  }
                };
                break;
              }
            case 'shake-cooldown':
              {
                var _r4 = definition(1).radius_du,
                  _y4 = rules.cup.inner_bottom_y_du + 150;
                add(1, 1, center, _y4, {
                  dangerEligible: true,
                  hasEnteredCup: true
                });
                tick = 120;
                shake = {
                  baseUsed: 1,
                  extraGranted: 0,
                  extraUsed: 0,
                  activeStartTick: 50,
                  cooldownUntilTick: 128
                };
                pattern = 'one-real-body-with-ended-active-shake-and-exact-m-plus-77-m-plus-78-cooldown-boundaries';
                geometry = {
                  acceptedShakeTick: 50,
                  rejectAtTick: 127,
                  acceptAtTick: 128,
                  cooldownUntilTick: 128
                };
                break;
              }
            case 'shake-drop':
              {
                var _r5 = definition(1).radius_du,
                  _y5 = rules.cup.inner_bottom_y_du + 150;
                add(1, 1, center, _y5, {
                  dangerEligible: true,
                  hasEnteredCup: true
                });
                tick = 90;
                shake = {
                  baseUsed: 1,
                  extraGranted: 0,
                  extraUsed: 0,
                  activeStartTick: 50,
                  cooldownUntilTick: 128
                };
                pattern = 'real-drop-active-shake-m-plus-47-reject-and-m-plus-48-accept';
                geometry = {
                  shakeStartTick: 50,
                  dropRejectAtTick: 97,
                  dropAcceptAtTick: 98,
                  spawnXDu: center
                };
                break;
              }
            case 'shake-pause':
              {
                var _r6 = definition(1).radius_du,
                  _y6 = rules.cup.inner_bottom_y_du + _r6 + 150;
                add(1, 1, center, _y6, {
                  dangerEligible: true,
                  hasEnteredCup: true
                });
                pattern = 'single-real-body-for-pausing-midway-through-48-step-shake-and-resuming-remaining-steps';
                geometry = {
                  durationTicks: 48,
                  observeAtElapsed: 24
                };
                break;
              }
            case 'shake-mass':
              {
                var _y7 = rules.cup.inner_bottom_y_du + 120;
                add(1, 1, center - 45, _y7, {
                  dangerEligible: true,
                  hasEnteredCup: true
                });
                add(2, 2, center + 45, _y7, {
                  dangerEligible: true,
                  hasEnteredCup: true
                });
                pattern = 'two-separated-no-contact-real-level1-and-level2-bodies-for-force-mass-measurement';
                geometry = {
                  bodyIds: [1, 2],
                  centerDistanceDu: 90,
                  radiiDu: [definition(1).radius_du, definition(2).radius_du],
                  noInitialContact: true
                };
                break;
              }
            case 'shake-sleep':
              {
                var _r7 = definition(1).radius_du,
                  _y8 = rules.cup.inner_bottom_y_du + _r7;
                add(1, 1, center, _y8, {
                  sleeping: true,
                  dangerEligible: true,
                  hasEnteredCup: true
                });
                pattern = 'one-real-sleeping-level1-body-resting-on-floor-inside-cup';
                geometry = {
                  entityId: 1,
                  radiusDu: _r7,
                  centerDu: {
                    x: center,
                    y: _y8
                  }
                };
                break;
              }
            case 'create-fault':
              pair(1, 1);
              pattern = 'one-real-contact-pair-with-single-child-create-fault-injection';
              break;
            case 'commit-fault':
              [[357, 382], [393, 382], [357, 418], [393, 418]].forEach(function (_ref11, i) {
                var x = _ref11[0],
                  y = _ref11[1];
                return add(i + 1, 1, x, y, {
                  dangerEligible: true,
                  hasEnteredCup: true
                });
              });
              pattern = 'two-independent-real-merge-pairs-with-fault-after-first-commit-during-second';
              break;
            case 'stale-contact':
              pair(1, 2);
              pattern = 'real-mixed-level-contact-before-dispose-and-stale-callback-isolation';
              break;
            case 'roundtrip':
              {
                tick = 120;
                dangerTicks = 20;
                var _r8 = definition(1).radius_du;
                add(1, 1, 250, rules.cup.inner_bottom_y_du + _r8, {
                  sleeping: true,
                  hasEnteredCup: true
                });
                add(2, 1, center, rules.cup.danger_line_y_du + _r8 + 10, {
                  dangerEligible: true,
                  hasEnteredCup: true
                });
                // 32 DU/s is exactly representable at PTM32 in Box2D; keep the
                // moving-body round-trip check byte-for-byte stable across WASM.
                add(3, 1, 450, 800, {
                  velocityDuPerSecond: {
                    x: 32,
                    y: 0
                  },
                  dangerEligible: true,
                  hasEnteredCup: true
                });
                shake = {
                  baseUsed: 1,
                  extraGranted: 0,
                  extraUsed: 0,
                  activeStartTick: tick - 10,
                  cooldownUntilTick: tick + 18
                };
                var bottomBody = states[0],
                  dangerBody = states[1],
                  movingBody = states[2];
                if (dangerBody.positionDu.y + _r8 <= rules.cup.danger_line_y_du || dangerBody.positionDu.y + _r8 >= rules.cup.inner_top_y_du || !bottomBody.sleeping || movingBody.sleeping || shake.activeStartTick === null || tick - shake.activeStartTick >= 48) throw new Error('SAVE_ROUNDTRIP_STATE_INVALID');
                pattern = 'valid-sleeping-floor-body-plus-danger-eligible-awake-moving-body-with-active-base-shake';
                geometry = {
                  sleepingEntityId: 1,
                  dangerEntityId: 2,
                  movingEntityId: 3,
                  dangerTicks: dangerTicks,
                  shakeActiveRemainingTicks: 48 - (tick - shake.activeStartTick),
                  cup: {
                    centerXDu: center,
                    bottomYDu: rules.cup.inner_bottom_y_du,
                    topYDu: rules.cup.inner_top_y_du,
                    bottomWidthDu: rules.cup.bottom_width_du,
                    topWidthDu: rules.cup.top_width_du
                  }
                };
                break;
              }
            case 'cleanup20':
              pair(1, 1);
              pattern = 'real-contact-pair-before-owned-world-rebuild';
              break;
            case 'persistent':
              {
                var r1 = definition(1).radius_du,
                  r2 = definition(2).radius_du,
                  _y9 = rules.cup.inner_bottom_y_du + r1;
                add(1, 1, center - 52, _y9, {
                  dangerEligible: true,
                  hasEnteredCup: true
                });
                add(2, 1, center - 16, _y9, {
                  dangerEligible: true,
                  hasEnteredCup: true
                });
                add(3, 1, center + 35, _y9, {
                  dangerEligible: true,
                  hasEnteredCup: true
                });
                add(4, 2, center + 35 + r1 + r2 * .92, _y9 + r2 * .1, {
                  dangerEligible: true,
                  hasEnteredCup: true
                });
                pattern = 'one-real-same-level-merge-plus-one-separate-persistent-mixed-level-contact';
                geometry = {
                  mergePair: [1, 2],
                  persistentMixedPair: [3, 4],
                  radiiDu: [r1, r2]
                };
                break;
              }
            case 'inheritance':
              {
                var _r9 = definition(1).radius_du,
                  _y10 = rules.cup.inner_top_y_du + _r9 + 20;
                add(1, 1, center - _r9 * .94, _y10, {
                  bornTick: 1,
                  dangerEligible: false,
                  hasEnteredCup: true,
                  spillTicks: 3
                });
                add(2, 1, center + _r9 * .94, _y10, {
                  bornTick: 40,
                  dangerEligible: true,
                  hasEnteredCup: true,
                  spillTicks: 8
                });
                tick = 100;
                pattern = 'same-level-parents-with-distinct-born-eligibility-entered-and-spill-state';
                geometry = {
                  expectedBornTick: 1,
                  expectedDangerEligible: true,
                  expectedHasEnteredCup: true,
                  expectedSpillTicks: 8
                };
                break;
              }
            case 'weighted-state':
              {
                var _r10 = definition(1).radius_du,
                  _y11 = rules.cup.inner_bottom_y_du + _r10;
                add(1, 1, center - _r10 * .94, _y11, {
                  velocityDuPerSecond: {
                    x: 6,
                    y: 1
                  },
                  angleRadians: .5,
                  angularVelocity: 4,
                  dangerEligible: true,
                  hasEnteredCup: true
                });
                add(2, 1, center + _r10 * .94, _y11, {
                  velocityDuPerSecond: {
                    x: -2,
                    y: -1
                  },
                  angleRadians: 2.5,
                  angularVelocity: 8,
                  dangerEligible: true,
                  hasEnteredCup: true
                });
                pattern = 'equal-mass-parents-with-distinct-linear-and-angular-state';
                geometry = {
                  parents: [1, 2],
                  angleRadians: [.5, 2.5],
                  angularVelocity: [4, 8],
                  maxLinearSpeedDuPerSecond: rules.physics.max_linear_speed * rules.viewport.du_per_spec_physics_unit,
                  maxAngularSpeed: rules.physics.max_angular_speed
                };
                break;
              }
            case 'neighbor-overlap':
              {
                var _r11 = definition(1).radius_du,
                  _r12 = definition(2).radius_du,
                  r3 = definition(3).radius_du,
                  _y12 = rules.cup.inner_bottom_y_du + 90,
                  d = _r11 * .94,
                  neighborDistance = _r12 + r3 - .2;
                add(1, 1, center - d, _y12, {
                  dangerEligible: true,
                  hasEnteredCup: true
                });
                add(2, 1, center + d, _y12, {
                  dangerEligible: true,
                  hasEnteredCup: true
                });
                add(3, 3, center, _y12 + neighborDistance, {
                  dangerEligible: true,
                  hasEnteredCup: true
                });
                pattern = 'legal-level1-parent-pair-and-level3-neighbor-overlapped-by-level2-child';
                geometry = {
                  parentCenterDistanceDu: 2 * d,
                  neighborDistanceDu: neighborDistance,
                  neighborRadiusDu: r3,
                  childRadiusDu: _r12,
                  initialOverlapDu: _r12 + r3 - neighborDistance
                };
                break;
              }
            case 'angular-unit':
              {
                var _r13 = definition(1).radius_du,
                  _y13 = rules.cup.inner_bottom_y_du + _r13 + 140,
                  offset = _r13 + 20;
                if (center - offset - _r13 <= center - rules.cup.top_width_du / 2 || center + offset + _r13 >= center + rules.cup.top_width_du / 2) throw new Error('ANGULAR_FIXTURE_NOT_FINITE_CUP_INTERIOR');
                add(1, 1, center - offset, _y13, {
                  angularVelocity: 1,
                  dangerEligible: true,
                  hasEnteredCup: true
                });
                add(2, 1, center + offset, _y13, {
                  angularVelocity: 12,
                  dangerEligible: true,
                  hasEnteredCup: true
                });
                pattern = 'two-separated-real-level1-bodies-with-1-and-12-rad-per-second-to-fit-the-finite-cup';
                geometry = {
                  entityIds: [1, 2],
                  angularVelocityRadPerSecond: [1, 12],
                  maxAngularSpeed: rules.physics.max_angular_speed,
                  noInitialContact: true
                };
                break;
              }
            case 'linear-limit':
              {
                var _r14 = definition(1).radius_du,
                  _y14 = rules.cup.inner_bottom_y_du + _r14,
                  max = rules.physics.max_linear_speed * rules.viewport.du_per_spec_physics_unit;
                add(1, 1, center - _r14 * .94, _y14, {
                  velocityDuPerSecond: {
                    x: max * .7,
                    y: max * .7
                  },
                  dangerEligible: true,
                  hasEnteredCup: true
                });
                add(2, 1, center + _r14 * .94, _y14, {
                  velocityDuPerSecond: {
                    x: -max * .7,
                    y: max * .7
                  },
                  dangerEligible: true,
                  hasEnteredCup: true
                });
                pattern = 'touching-pair-at-diagonal-configured-linear-speed-limit';
                geometry = {
                  maxLinearSpeedDuPerSecond: max,
                  initialVectorMagnitudeDuPerSecond: max * Math.sqrt(.98)
                };
                break;
              }
            case 'level-pairs':
            case 'level-pair':
              {
                if (level > 8) throw new Error('FIXTURE_PAIR_LEVEL_MUST_BE_1_TO_8');
                var radius = definition(level).radius_du,
                  bottom = rules.cup.inner_bottom_y_du,
                  top = rules.cup.inner_top_y_du;
                var walls = [[{
                  x: center - rules.cup.bottom_width_du / 2,
                  y: bottom
                }, {
                  x: center - rules.cup.top_width_du / 2,
                  y: top
                }], [{
                  x: center + rules.cup.bottom_width_du / 2,
                  y: bottom
                }, {
                  x: center + rules.cup.top_width_du / 2,
                  y: top
                }], [{
                  x: center - rules.cup.bottom_width_du / 2,
                  y: bottom
                }, {
                  x: center + rules.cup.bottom_width_du / 2,
                  y: bottom
                }]];
                var endpoints = walls.reduce(function (all, wall) {
                  return all.concat([wall[0], wall[1]]);
                }, []);
                var _segmentDistance = function _segmentDistance(p, a, b) {
                  var vx = b.x - a.x,
                    vy = b.y - a.y,
                    t = Math.max(0, Math.min(1, ((p.x - a.x) * vx + (p.y - a.y) * vy) / (vx * vx + vy * vy)));
                  return Math.hypot(p.x - a.x - t * vx, p.y - a.y - t * vy);
                };
                var legal = function legal(points) {
                  return points.every(function (p) {
                    return walls.every(function (_ref12) {
                      var a = _ref12[0],
                        b = _ref12[1];
                      return _segmentDistance(p, a, b) > radius;
                    }) && endpoints.every(function (e) {
                      return Math.hypot(p.x - e.x, p.y - e.y) > radius;
                    });
                  });
                };
                var horizontal = [{
                  x: center - radius * .94,
                  y: floor
                }, {
                  x: center + radius * .94,
                  y: floor
                }];
                var vertical = [{
                  x: center,
                  y: 500
                }, {
                  x: center,
                  y: 500 + 2 * radius
                }];
                var points = legal(horizontal) ? horizontal : legal(vertical) ? vertical : null;
                if (!points) throw new Error("FIXTURE_PAIR_HAS_NO_LEGAL_CONFIG_LAYOUT:" + level);
                add(1, level, points[0].x, points[0].y);
                add(2, level, points[1].x, points[1].y);
                pattern = "pair-" + level + "-" + level + "-" + (points === horizontal ? 'horizontal' : 'vertical') + "-finite-wall-validated";
                geometry = {
                  layout: points === horizontal ? 'horizontal' : 'vertical',
                  parentCentersDu: points.map(function (p) {
                    return _extends({}, p);
                  }),
                  radiusDu: radius,
                  minimumFiniteWallClearanceDu: Math.min.apply(Math, points.reduce(function (all, p) {
                    return all.concat(walls.map(function (_ref13) {
                      var a = _ref13[0],
                        b = _ref13[1];
                      return _segmentDistance(p, a, b) - radius;
                    }));
                  }, [])),
                  minimumEndpointClearanceDu: Math.min.apply(Math, points.reduce(function (all, p) {
                    return all.concat(endpoints.map(function (e) {
                      return Math.hypot(p.x - e.x, p.y - e.y) - radius;
                    }));
                  }, []))
                };
                break;
              }
            case 'three':
              {
                var _r15 = definition(1).radius_du;
                [-1, 0, 1].forEach(function (v, i) {
                  return add(i + 1, 1, center + v * _r15 * .94, floor);
                });
                pattern = 'three-overlapping-level1';
                break;
              }
            case 'four':
              {
                // Match the documented square: two horizontal, independent same-level pairs.
                // A four-circle chain made three adjacent contacts and hid the second pair.
                [[357, 382], [393, 382], [357, 418], [393, 418]].forEach(function (_ref14, i) {
                  var x = _ref14[0],
                    y = _ref14[1];
                  return add(i + 1, 1, x, y);
                });
                pattern = 'four-level1-square-two-pairs';
                break;
              }
            case 'mixed-level':
              pair(1, 2);
              pattern = 'touching-level1-level2';
              break;
            case 'max-level':
              pair(9, 9);
              pattern = 'touching-level9-no-next-level';
              break;
            case 'wall-projection':
              {
                var _r16 = definition(1).radius_du,
                  _y15 = rules.cup.inner_bottom_y_du + _r16,
                  gapDu = .2,
                  approachSpeedDuPerSecond = 6;
                add(1, 1, center - _r16 - gapDu / 2, _y15, {
                  dangerEligible: true,
                  hasEnteredCup: true,
                  velocityDuPerSecond: {
                    x: approachSpeedDuPerSecond,
                    y: 0
                  }
                });
                add(2, 1, center + _r16 + gapDu / 2, _y15, {
                  dangerEligible: true,
                  hasEnteredCup: true,
                  velocityDuPerSecond: {
                    x: -approachSpeedDuPerSecond,
                    y: 0
                  }
                });
                pattern = 'two-legally-separated-bottom-supported-parents-converge-under-real-gravity-before-finite-wall-child-projection';
                geometry = {
                  parentCenterDistanceDu: 2 * _r16 + gapDu,
                  initialParentGapDu: gapDu,
                  approachSpeedDuPerSecond: approachSpeedDuPerSecond,
                  parentBottomClearanceDu: _y15 - _r16 - rules.cup.inner_bottom_y_du,
                  projectedChildRadiusDu: definition(2).radius_du,
                  cup: {
                    centerXDu: center,
                    bottomYDu: rules.cup.inner_bottom_y_du,
                    topYDu: rules.cup.inner_top_y_du,
                    bottomWidthDu: rules.cup.bottom_width_du,
                    topWidthDu: rules.cup.top_width_du
                  }
                };
                break;
              }
            case 'next-generation':
              {
                var _r17 = definition(1).radius_du,
                  _r18 = definition(2).radius_du,
                  _y16 = rules.cup.inner_bottom_y_du + 90;
                var parentOffset = _r17 * .94,
                  childNeighborDistance = 2 * _r18 - .2,
                  neighborY = _y16 + childNeighborDistance;
                var neighborParentDistance = Math.hypot(parentOffset, childNeighborDistance);
                if (neighborParentDistance <= _r17 + _r18 || neighborY + _r18 >= rules.cup.inner_top_y_du) throw new Error('NEXT_GENERATION_GEOMETRY_NOT_SEPARATED_OR_INSIDE_CUP');
                add(1, 1, center - parentOffset, _y16, {
                  dangerEligible: true,
                  hasEnteredCup: true
                });
                add(2, 1, center + parentOffset, _y16, {
                  dangerEligible: true,
                  hasEnteredCup: true
                });
                add(3, 2, center, neighborY, {
                  dangerEligible: true,
                  hasEnteredCup: true
                });
                pattern = 'two-overlapping-level1-parents-plus-one-legally-separated-level2-neighbor-contacted-by-new-child-on-next-real-fixed-step';
                geometry = {
                  parentCenterDistanceDu: 2 * parentOffset,
                  parentGapDu: 2 * _r17 - 2 * parentOffset,
                  childNeighborDistanceDu: childNeighborDistance,
                  childNeighborOverlapDu: 2 * _r18 - childNeighborDistance,
                  neighborParentDistanceDu: neighborParentDistance,
                  neighborParentClearanceDu: neighborParentDistance - _r17 - _r18,
                  initialSameLevelPairs: [],
                  cup: {
                    centerXDu: center,
                    bottomYDu: rules.cup.inner_bottom_y_du,
                    topYDu: rules.cup.inner_top_y_du,
                    bottomWidthDu: rules.cup.bottom_width_du,
                    topWidthDu: rules.cup.top_width_du
                  }
                };
                break;
              }
            case 'merge-wall-impact':
              {
                var _r19 = definition(2).radius_du,
                  _r20 = definition(3).radius_du;
                var x2 = center + 35.81240475177765,
                  y2 = 293.28369331359863,
                  x3 = center + 71.86902165412903,
                  y3 = 327.1127028465271;
                var v2 = {
                    x: 4.274560511112213,
                    y: -0.24879961274564266
                  },
                  v3 = {
                    x: -13.732048869132996,
                    y: -29.868710041046143
                  };
                add(1, 2, x2, y2, {
                  velocityDuPerSecond: v2,
                  dangerEligible: true,
                  hasEnteredCup: true
                });
                add(2, 3, x3, y3, {
                  velocityDuPerSecond: v3,
                  dangerEligible: true,
                  hasEnteredCup: true
                });
                var centerDistanceDu = Math.hypot(x3 - x2, y3 - y2),
                  overlapDu = _r19 + _r20 - centerDistanceDu;
                if (overlapDu <= 0) throw new Error('MERGE_WALL_IMPACT_MUST_PRESERVE_OBSERVED_POST_MERGE_OVERLAP');
                pattern = 'observed-tick8-merge-child-and-level3-neighbor-post-transaction-state-real-physics-continuation';
                geometry = {
                  sourceBuildId: '20261031-p1b-pressure-provenance-wip-46',
                  sourceAttemptId: 'WIP46-BUILD07-PRESSURE-OFF-001',
                  sourceTick: 8,
                  sourceChildId: 236,
                  sourceNeighborId: 237,
                  centerDistanceDu: centerDistanceDu,
                  initialOverlapDu: overlapDu,
                  childBottomClearanceDu: y2 - _r19 - rules.cup.inner_bottom_y_du,
                  neighborBottomClearanceDu: y3 - _r20 - rules.cup.inner_bottom_y_du,
                  cup: {
                    centerXDu: center,
                    bottomYDu: rules.cup.inner_bottom_y_du,
                    topYDu: rules.cup.inner_top_y_du,
                    bottomWidthDu: rules.cup.bottom_width_du,
                    topWidthDu: rules.cup.top_width_du
                  }
                };
                break;
              }
            case 'multi-contact':
            case 'multi-pair':
              pair(1, 1, floor, -definition(2).radius_du * 2);
              pair(2, 2, floor, definition(2).radius_du * 2);
              pattern = 'two-separated-real-contact-pairs';
              break;
            case 'tie-order':
              {
                var _options$contactOrder;
                var _r21 = definition(1).radius_du,
                  _d = 2 * _r21;
                var h = Math.sqrt(_d * _d - _d / 2 * (_d / 2));
                add(1, 1, center - _d / 2, floor, {
                  dangerEligible: true,
                  hasEnteredCup: true
                });
                add(2, 1, center + _d / 2, floor, {
                  dangerEligible: true,
                  hasEnteredCup: true
                });
                add(3, 1, center, floor + h, {
                  dangerEligible: true,
                  hasEnteredCup: true
                });
                if (!['forward', 'reverse'].includes(String((_options$contactOrder = options.contactOrder) != null ? _options$contactOrder : ''))) throw new Error('TIE_ORDER_REQUIRES_FORWARD_OR_REVERSE');
                pattern = "equilateral-three-body-real-contact-tie-enumeration-" + String(options.contactOrder);
                break;
              }
            case 'contact-grace':
              tick = 44;
              pair(1, 1, floor);
              for (var _iterator14 = _createForOfIteratorHelperLoose(states), _step14; !(_step14 = _iterator14()).done;) {
                var item = _step14.value;
                item.bornTick = 44;
                item.dangerEligible = false;
              }
              pattern = 'born-at-tick44-real-contact-qualifies-at-tick45-before-age-grace';
              break;
            case 'grace':
              {
                var _options$tick2;
                var _r22 = definition(1).radius_du,
                  _y17 = rules.cup.inner_bottom_y_du + _r22 + 80;
                tick = Number((_options$tick2 = options.tick) != null ? _options$tick2 : 45);
                add(1, 1, center, _y17, {
                  bornTick: Math.max(0, tick - 44),
                  dangerEligible: false,
                  hasEnteredCup: true
                });
                pattern = 'single-no-contact-body-at-explicit-danger-eligibility-age';
                geometry = {
                  requestedTick: tick,
                  bornTick: states[0].bornTick,
                  expectedAge: tick - states[0].bornTick
                };
                break;
              }
            case 'danger-line':
              {
                var _options$tick3;
                var _r23 = definition(1).radius_du;
                tick = Number((_options$tick3 = options.tick) != null ? _options$tick3 : 100);
                var exact = rules.cup.danger_line_y_du - _r23;
                add(1, 1, center, exact, {
                  bornTick: 0,
                  dangerEligible: true,
                  hasEnteredCup: true
                });
                add(2, 1, center + 60, exact + 0.01, {
                  bornTick: 0,
                  dangerEligible: true,
                  hasEnteredCup: true
                });
                pattern = 'eligible-bodies-straddling-strict-danger-line-boundary';
                geometry = {
                  lineYDu: rules.cup.danger_line_y_du,
                  radiusDu: _r23,
                  bodyTopsDu: states.map(function (s) {
                    return s.positionDu.y + _r23;
                  }),
                  expectedTopDeltasDu: [0, .01]
                };
                break;
              }
            case 'danger-alternate':
              {
                var _options$tick4, _options$dangerTicks;
                var _r24 = definition(1).radius_du,
                  line = rules.cup.danger_line_y_du;
                tick = Number((_options$tick4 = options.tick) != null ? _options$tick4 : 178);
                dangerTicks = Number((_options$dangerTicks = options.dangerTicks) != null ? _options$dangerTicks : 178);
                add(1, 1, center - 40, line - _r24 + 1, {
                  bornTick: 0,
                  dangerEligible: true,
                  hasEnteredCup: true,
                  velocityDuPerSecond: {
                    x: 0,
                    y: -120
                  }
                });
                add(2, 1, center + 40, line - _r24 - 2, {
                  bornTick: 0,
                  dangerEligible: true,
                  hasEnteredCup: true,
                  velocityDuPerSecond: {
                    x: 0,
                    y: 240
                  }
                });
                pattern = 'two-separated-qualified-real-bodies-with-opposing-vertical-trajectories-across-danger-line';
                geometry = {
                  lineYDu: line,
                  radiusDu: _r24,
                  initialTopDeltasDu: states.map(function (s) {
                    return s.positionDu.y + _r24 - line;
                  }),
                  initialDangerTicks: dangerTicks,
                  bodyIds: [1, 2]
                };
                break;
              }
            case 'danger-during-shake':
              {
                var _options$tick5, _options$dangerTicks2;
                var _r25 = definition(1).radius_du,
                  _line = rules.cup.danger_line_y_du;
                tick = Number((_options$tick5 = options.tick) != null ? _options$tick5 : 100);
                dangerTicks = Number((_options$dangerTicks2 = options.dangerTicks) != null ? _options$dangerTicks2 : 178);
                add(1, 1, center, _line - _r25 + 3, {
                  bornTick: 0,
                  dangerEligible: true,
                  hasEnteredCup: true
                });
                var activeStartTick = tick - 12;
                shake = {
                  baseUsed: 1,
                  extraGranted: 0,
                  extraUsed: 0,
                  activeStartTick: activeStartTick,
                  cooldownUntilTick: tick + 66
                };
                pattern = 'qualified-real-body-continuously-over-danger-line-during-active-base-shake';
                geometry = {
                  lineYDu: _line,
                  radiusDu: _r25,
                  bodyTopDu: states[0].positionDu.y + _r25,
                  activeStartTick: activeStartTick,
                  activeUntilTick: activeStartTick + 48,
                  requestedDangerTicks: dangerTicks
                };
                break;
              }
            case 'entered':
              {
                var _options$tick6;
                var _r26 = definition(1).radius_du,
                  _top = rules.cup.inner_top_y_du;
                tick = Number((_options$tick6 = options.tick) != null ? _options$tick6 : 0);
                add(1, 1, center - 45, _top + _r26 + 8, {
                  bornTick: tick,
                  dangerEligible: false,
                  hasEnteredCup: false
                });
                add(2, 1, center + 45, _top - _r26 - 1, {
                  bornTick: tick,
                  dangerEligible: false,
                  hasEnteredCup: false
                });
                pattern = 'real-bodies-one-wholly-above-open-rim-and-one-fully-crossed-into-cup';
                geometry = {
                  rimYDu: _top,
                  radiusDu: _r26,
                  bodyIds: [1, 2],
                  expectedEntered: [false, true],
                  topClearancesDu: states.map(function (s) {
                    return _top - (s.positionDu.y + _r26);
                  })
                };
                break;
              }
            case 'merge-before-danger':
              {
                var _options$tick7, _options$dangerTicks3;
                var _r27 = definition(1).radius_du,
                  initialOverlapDu = 0.1,
                  dy = 2 * _r27 - initialOverlapDu,
                  midY = rules.cup.danger_line_y_du - definition(2).radius_du - 8;
                tick = Number((_options$tick7 = options.tick) != null ? _options$tick7 : 179);
                dangerTicks = Number((_options$dangerTicks3 = options.dangerTicks) != null ? _options$dangerTicks3 : 179);
                add(1, 1, center, midY - dy / 2, {
                  bornTick: 0,
                  dangerEligible: true,
                  hasEnteredCup: true,
                  velocityDuPerSecond: {
                    x: 0,
                    y: 30
                  }
                });
                add(2, 1, center, midY + dy / 2, {
                  bornTick: 0,
                  dangerEligible: true,
                  hasEnteredCup: true,
                  velocityDuPerSecond: {
                    x: 0,
                    y: -30
                  }
                });
                pattern = 'qualified-same-level-parent-contact-with-0.1du-overlap-inside-cup-and-real-opposing-velocity-before-180th-danger-step';
                geometry = {
                  parentIds: [1, 2],
                  parentRadiusDu: _r27,
                  initialOverlapDu: initialOverlapDu,
                  initialNoWallPenetration: true,
                  parentTopDeltasDu: states.map(function (s) {
                    return s.positionDu.y + _r27 - rules.cup.danger_line_y_du;
                  }),
                  initialCenterDistanceDu: dy,
                  relativeClosingSpeedDuPerSecond: 60,
                  childRadiusDu: definition(2).radius_du,
                  projectedChildTopDeltaDu: midY + definition(2).radius_du - rules.cup.danger_line_y_du,
                  requestedDangerTicks: dangerTicks
                };
                break;
              }
            case 'merge-danger-inherit':
              {
                var _options$tick8, _options$dangerTicks4;
                tick = Number((_options$tick8 = options.tick) != null ? _options$tick8 : 80);
                dangerTicks = Number((_options$dangerTicks4 = options.dangerTicks) != null ? _options$dangerTicks4 : 0);
                var _r28 = definition(1).radius_du,
                  _y18 = rules.cup.inner_bottom_y_du + _r28 + 150;
                add(1, 1, center - _r28 * .94, _y18, {
                  bornTick: 1,
                  dangerEligible: true,
                  hasEnteredCup: true
                });
                add(2, 1, center + _r28 * .94, _y18, {
                  bornTick: 40,
                  dangerEligible: false,
                  hasEnteredCup: true
                });
                pattern = 'real-contact-parent-pair-with-distinct-danger-age-and-explicit-eligibility-before-merge';
                geometry = {
                  parentIds: [1, 2],
                  parentBornTicks: [1, 40],
                  parentEligibility: [true, false],
                  requestedTick: tick,
                  childBornTick: 1,
                  childEligibility: true
                };
                break;
              }
            case 'spill-child':
              {
                var _options$tick9;
                tick = Number((_options$tick9 = options.tick) != null ? _options$tick9 : 29);
                var _r29 = definition(1).radius_du,
                  _y19 = rules.cup.inner_top_y_du + _r29 + 20;
                add(1, 1, center - _r29 * .94, _y19, {
                  bornTick: 0,
                  dangerEligible: true,
                  hasEnteredCup: true,
                  spillTicks: 29
                });
                add(2, 1, center + _r29 * .94, _y19, {
                  bornTick: 0,
                  dangerEligible: true,
                  hasEnteredCup: true,
                  spillTicks: 27
                });
                pattern = 'real-contact-parents-outside-open-rim-at-spill-boundary-child-inherits-max-counter';
                geometry = {
                  parentIds: [1, 2],
                  parentSpillTicks: [29, 27],
                  expectedInheritedSpillTicks: 29,
                  childRadiusDu: definition(2).radius_du,
                  childBottomClearanceDu: _y19 - definition(2).radius_du - rules.cup.inner_top_y_du
                };
                break;
              }
            case 'terminal-priority':
              {
                var _options$tick10, _options$dangerTicks5;
                tick = Number((_options$tick10 = options.tick) != null ? _options$tick10 : 179);
                dangerTicks = Number((_options$dangerTicks5 = options.dangerTicks) != null ? _options$dangerTicks5 : 179);
                var _r30 = definition(1).radius_du,
                  _y20 = rules.cup.inner_top_y_du + _r30 + 20;
                add(1, 1, center, _y20, {
                  bornTick: 0,
                  dangerEligible: true,
                  hasEnteredCup: true,
                  spillTicks: 29
                });
                pattern = 'single-qualified-entered-body-satisfies-cup-full-and-spill-threshold-on-same-fixed-step';
                geometry = {
                  entityId: 1,
                  requestedDangerTicks: dangerTicks,
                  spillTicks: 29,
                  bodyTopDu: _y20 + _r30,
                  bodyBottomDu: _y20 - _r30,
                  topYDu: rules.cup.inner_top_y_du,
                  dangerLineYDu: rules.cup.danger_line_y_du
                };
                break;
              }
            case 'mochi-milestone':
              {
                var _r31 = definition(9).radius_du,
                  _y21 = rules.cup.inner_bottom_y_du + _r31 + 120;
                add(1, 9, center, _y21, {
                  bornTick: 0,
                  dangerEligible: true,
                  hasEnteredCup: true
                });
                pattern = 'real-level9-milestone-body-remains-active-and-can-receive-subsequent-player-commands';
                geometry = {
                  entityId: 1,
                  level: 9,
                  radiusDu: _r31,
                  positionDu: {
                    x: center,
                    y: _y21
                  },
                  initialScore: base.score,
                  terminalReason: null
                };
                break;
              }
            case 'side-escape':
              {
                var _options$tick11;
                var _r32 = definition(1).radius_du;
                tick = Number((_options$tick11 = options.tick) != null ? _options$tick11 : 100);
                add(1, 1, center - rules.cup.top_width_du / 2 - _r32 - 5, rules.cup.inner_bottom_y_du + 100, {
                  bornTick: 0,
                  dangerEligible: true,
                  hasEnteredCup: true
                });
                pattern = 'debug-only-finite-body-injected-beyond-left-finite-wall-for-technical-freeze-not-natural-escape';
                geometry = {
                  entityId: 1,
                  radiusDu: _r32,
                  sideClearanceDu: -5,
                  injectionKind: 'debug-fixture-state',
                  naturalPhysicsClaim: false
                };
                break;
              }
            case 'spill-never-entered':
              {
                var _r33 = definition(1).radius_du;
                tick = 100;
                add(1, 1, center, rules.cup.inner_top_y_du + _r33 + 8, {
                  bornTick: 0,
                  dangerEligible: false,
                  hasEnteredCup: false
                });
                pattern = 'eligible-age-pending-body-above-rim-that-never-entered-cup';
                geometry = {
                  entityId: 1,
                  hasEnteredCup: false,
                  spillTicks: 0
                };
                break;
              }
            case 'spill-return':
              {
                var _options$tick12;
                var _r34 = definition(1).radius_du;
                tick = Number((_options$tick12 = options.tick) != null ? _options$tick12 : 29);
                add(1, 1, center, rules.cup.inner_top_y_du + _r34 + 2, {
                  velocityDuPerSecond: {
                    x: 0,
                    y: -400
                  },
                  bornTick: 0,
                  dangerEligible: true,
                  hasEnteredCup: true,
                  spillTicks: 29
                });
                pattern = 'previously-entered-body-at-29-spill-ticks-returning-across-rim';
                geometry = {
                  entityId: 1,
                  spillTicks: 29,
                  topYDu: rules.cup.inner_top_y_du
                };
                break;
              }
            case 'danger-reset':
              {
                var _options$tick13, _options$dangerTicks6;
                var r9 = definition(9).radius_du,
                  r8 = definition(8).radius_du,
                  y9 = rules.cup.inner_bottom_y_du + r9,
                  y8 = y9 + r9 + r8;
                tick = Number((_options$tick13 = options.tick) != null ? _options$tick13 : 179);
                dangerTicks = Number((_options$dangerTicks6 = options.dangerTicks) != null ? _options$dangerTicks6 : 179);
                if (!Number.isSafeInteger(tick) || tick < 179 || !Number.isSafeInteger(dangerTicks) || dangerTicks !== 179) throw new Error('DANGER_RESET_FIXTURE_BOUNDARY_INVALID');
                add(1, 9, center, y9, {
                  dangerEligible: true,
                  hasEnteredCup: true
                });
                add(2, 8, center, y8, {
                  dangerEligible: true,
                  hasEnteredCup: true
                });
                var bodyTop = y8 + r8,
                  lineClearance = rules.cup.danger_line_y_du - bodyTop;
                if (lineClearance <= 0) throw new Error('DANGER_RESET_GEOMETRY_NOT_SAFE');
                geometry = {
                  requestedTick: tick,
                  requestedDangerTicks: dangerTicks,
                  levels: [9, 8],
                  supportGapDu: y8 - y9 - r9 - r8,
                  bodyTopDu: bodyTop,
                  dangerLineYDu: rules.cup.danger_line_y_du,
                  dangerClearanceDu: lineClearance,
                  centerXDu: center
                };
                pattern = 'config-derived-real-9-8-supported-column-resetting-danger-on-next-step';
                break;
              }
            case 'danger-supported-continuous':
            case 'danger-supported-continuous-shortcup':
              {
                var _options$tick14, _options$dangerTicks7;
                var tickOption = (_options$tick14 = options.tick) != null ? _options$tick14 : 0,
                  dangerOption = (_options$dangerTicks7 = options.dangerTicks) != null ? _options$dangerTicks7 : 0;
                if (typeof tickOption !== 'number' || typeof dangerOption !== 'number' || !Number.isSafeInteger(tickOption) || tickOption < 0 || !Number.isSafeInteger(dangerOption) || dangerOption < 0 || dangerOption > 179 || dangerOption > tickOption) throw new Error('DANGER_SUPPORTED_FIXTURE_TICK_INVALID');
                tick = tickOption;
                dangerTicks = dangerOption;
                var _r35 = definition(9).radius_du,
                  _r36 = definition(8).radius_du,
                  topLevel = fixtureId === 'danger-supported-continuous-shortcup' ? 4 : 9,
                  rTop = definition(topLevel).radius_du;
                var _y22 = rules.cup.inner_bottom_y_du + _r35,
                  _y23 = _y22 + _r35 + _r36,
                  yTop = _y23 + _r36 + rTop;
                var wallSlope = (rules.cup.top_width_du - rules.cup.bottom_width_du) / (2 * (rules.cup.inner_top_y_du - rules.cup.inner_bottom_y_du));
                var wallMargin = (rules.cup.bottom_width_du / 2 + Math.abs(wallSlope) * (yTop - rules.cup.inner_bottom_y_du) - rTop) / Math.sqrt(1 + wallSlope * wallSlope);
                var endpointPoints = [{
                  x: center - rules.cup.bottom_width_du / 2,
                  y: rules.cup.inner_bottom_y_du
                }, {
                  x: center + rules.cup.bottom_width_du / 2,
                  y: rules.cup.inner_bottom_y_du
                }, {
                  x: center - rules.cup.top_width_du / 2,
                  y: rules.cup.inner_top_y_du
                }, {
                  x: center + rules.cup.top_width_du / 2,
                  y: rules.cup.inner_top_y_du
                }];
                var endpointClearances = [];
                for (var _i7 = 0, _arr6 = [{
                    x: center,
                    y: _y22,
                    r: _r35
                  }, {
                    x: center,
                    y: _y23,
                    r: _r36
                  }, {
                    x: center,
                    y: yTop,
                    r: rTop
                  }]; _i7 < _arr6.length; _i7++) {
                  var c = _arr6[_i7];
                  for (var _iterator15 = _createForOfIteratorHelperLoose(endpointPoints), _step15; !(_step15 = _iterator15()).done;) {
                    var p = _step15.value;
                    endpointClearances.push(Math.hypot(c.x - p.x, c.y - p.y) - c.r);
                  }
                }
                var endpointMargin = Math.min.apply(Math, endpointClearances);
                var dangerClearance = yTop + rTop - rules.cup.danger_line_y_du,
                  topClearance = rules.cup.inner_top_y_du - (yTop + rTop);
                if (wallMargin <= 0 || yTop + rTop >= rules.cup.inner_top_y_du || yTop + rTop <= rules.cup.danger_line_y_du) throw new Error('DANGER_SUPPORT_GEOMETRY_INVALID');
                if (endpointMargin <= 0 || dangerClearance <= 0 || topClearance <= 0) throw new Error('DANGER_SUPPORT_ENDPOINT_OR_BOUNDARY_INVALID');
                add(1, 9, center, _y22, {
                  dangerEligible: true,
                  hasEnteredCup: true
                });
                add(2, 8, center, _y23, {
                  dangerEligible: true,
                  hasEnteredCup: true
                });
                add(3, topLevel, center, yTop, {
                  dangerEligible: true,
                  hasEnteredCup: true
                });
                geometry = {
                  levels: [9, 8, topLevel],
                  sideWallClearanceDu: wallMargin,
                  endpointClearanceDu: endpointMargin,
                  dangerClearanceDu: dangerClearance,
                  topClearanceDu: topClearance,
                  lowerSupportGapDu: _y23 - _y22 - _r35 - _r36,
                  upperSupportGapDu: yTop - _y23 - _r36 - rTop,
                  outerSameLevelGapDu: yTop - _y22 - 2 * _r35,
                  outerSurfaceGapDu: yTop - _y22 - _r35 - rTop,
                  requestedTick: tickOption,
                  requestedDangerTicks: dangerOption
                };
                pattern = "config-derived-9-8-" + topLevel + "-real-contact-support-column";
                break;
              }
            case 'danger179':
            case 'danger180':
              {
                var _r37 = definition(1).radius_du;
                tick = fixtureId === 'danger179' ? 179 : 180;
                dangerTicks = fixtureId === 'danger179' ? 179 : 0;
                add(1, 1, center, rules.cup.danger_line_y_du + _r37 + Math.max(2, _r37 * .05), {
                  dangerEligible: true,
                  hasEnteredCup: true
                });
                pattern = "supplemental-seeded-danger-boundary-" + tick;
                break;
              }
            case 'revive-candidate':
              {
                var _r38 = definition(1).radius_du,
                  _r39 = definition(3).radius_du,
                  _top2 = rules.cup.inner_top_y_du,
                  _floor = rules.cup.inner_bottom_y_du;
                tick = 29;
                add(1, 3, center, _floor + _r39, {
                  dangerEligible: true,
                  hasEnteredCup: true
                });
                add(2, 1, center, _top2 + _r38 + 12, {
                  bornTick: 0,
                  dangerEligible: true,
                  hasEnteredCup: true,
                  spillTicks: 29
                });
                pattern = 'one-safe-supported-item-inside-plus-one-spilling-item-for-local-revive-flow';
                geometry = {
                  safeLevel: 3,
                  spilledEntityId: 2,
                  spilledSpillTicks: 29,
                  topYDu: _top2
                };
                break;
              }
            case 'spill-threshold':
              {
                var _r40 = definition(1).radius_du;
                tick = 29;
                add(1, 1, center, rules.cup.inner_top_y_du + _r40 + 12, {
                  hasEnteredCup: true,
                  spillTicks: 29
                });
                pattern = 'entered-body-one-tick-before-spill-terminal';
                break;
              }
            case 'blocked-spawn':
              {
                var _r41 = definition(1).radius_du;
                add(1, 1, center, rules.cup.spawn_y_du, {
                  hasEnteredCup: false
                });
                pattern = 'real-body-blocking-spawn-center';
                break;
              }
            case 'spawn-boundary':
              pattern = 'empty-spawn-boundary-command-fixture';
              break;
            case 'spawn-tangent':
              {
                var _options$xDu;
                var x = (_options$xDu = options.xDu) != null ? _options$xDu : rules.cup.center_x_du,
                  _r42 = definition(level).radius_du;
                if (typeof x !== 'number' || !Number.isFinite(x)) throw new Error('FIXTURE_X_INVALID');
                add(1, level, x + 2 * _r42, rules.cup.spawn_y_du);
                pattern = 'real-body-exactly-tangent-to-requested-spawn';
                break;
              }
            case 'save-cost-220':
              {
                var _options$count;
                var count = Number((_options$count = options.count) != null ? _options$count : 220);
                if (count !== 220) throw new Error('SAVE_COST_FIXTURE_REQUIRES_EXACTLY_220');
                var _r43 = definition(1).radius_du,
                  clearanceGapDu = 0.5,
                  boundaryClearanceDu = 3,
                  dx = 2 * _r43 + clearanceGapDu,
                  _dy = Math.sqrt(3) * _r43 + clearanceGapDu;
                var bottomY = rules.cup.inner_bottom_y_du,
                  topY = rules.cup.inner_top_y_du;
                var leftBottom = {
                    x: center - rules.cup.bottom_width_du / 2,
                    y: bottomY
                  },
                  leftTop = {
                    x: center - rules.cup.top_width_du / 2,
                    y: topY
                  };
                var rightBottom = {
                    x: center + rules.cup.bottom_width_du / 2,
                    y: bottomY
                  },
                  rightTop = {
                    x: center + rules.cup.top_width_du / 2,
                    y: topY
                  };
                var _segmentDistance2 = function _segmentDistance2(p, a, b) {
                  var vx = b.x - a.x,
                    vy = b.y - a.y,
                    t = Math.max(0, Math.min(1, ((p.x - a.x) * vx + (p.y - a.y) * vy) / (vx * vx + vy * vy)));
                  return Math.hypot(p.x - a.x - t * vx, p.y - a.y - t * vy);
                };
                var slope = (rules.cup.top_width_du - rules.cup.bottom_width_du) / (2 * (topY - bottomY)),
                  normalScale = Math.sqrt(1 + slope * slope);
                var leftInteriorMargin = function leftInteriorMargin(p) {
                  return (p.x - leftBottom.x + slope * (p.y - bottomY)) / normalScale;
                };
                var rightInteriorMargin = function rightInteriorMargin(p) {
                  return (rightBottom.x - p.x + slope * (p.y - bottomY)) / normalScale;
                };
                var candidates = [];
                var row = 0;
                var _loop3 = function _loop3(_y24) {
                  var offset = row % 2 ? dx / 2 : 0;
                  var _loop4 = function _loop4(_x10) {
                      var p = {
                        x: _x10,
                        y: _y24
                      };
                      if (leftInteriorMargin(p) < _r43 + boundaryClearanceDu || rightInteriorMargin(p) < _r43 + boundaryClearanceDu) return 0; // continue
                      if (_segmentDistance2(p, leftBottom, leftTop) <= _r43 + boundaryClearanceDu || _segmentDistance2(p, rightBottom, rightTop) <= _r43 + boundaryClearanceDu) return 0; // continue
                      if (Math.hypot(p.x - leftBottom.x, p.y - leftBottom.y) <= _r43 + boundaryClearanceDu || Math.hypot(p.x - rightBottom.x, p.y - rightBottom.y) <= _r43 + boundaryClearanceDu) return 0; // continue
                      if (_y24 - bottomY <= _r43 + boundaryClearanceDu || topY - _y24 <= _r43 + boundaryClearanceDu) return 0; // continue
                      if (candidates.some(function (q) {
                        return Math.pow(q.x - _x10, 2) + Math.pow(q.y - _y24, 2) < Math.pow(2 * _r43 + 0.5, 2);
                      })) return 0; // continue
                      candidates.push({
                        x: _x10,
                        y: _y24,
                        row: row
                      });
                      if (candidates.length === count) return 1; // break
                    },
                    _ret2;
                  for (var _x10 = center - rules.cup.top_width_du / 2 + _r43 + boundaryClearanceDu + offset; _x10 <= center + rules.cup.top_width_du / 2 - _r43 - boundaryClearanceDu; _x10 += dx) {
                    _ret2 = _loop4(_x10);
                    if (_ret2 === 0) continue;
                    if (_ret2 === 1) break;
                  }
                };
                for (var _y24 = bottomY + _r43 + boundaryClearanceDu; _y24 <= topY - _r43 - boundaryClearanceDu && candidates.length < count; _y24 += _dy, row++) {
                  _loop3(_y24);
                }
                if (candidates.length !== count) throw new Error("SAVE_COST_FIXTURE_PACKING_FAILED:" + candidates.length + "/" + count);
                for (var _iterator16 = _createForOfIteratorHelperLoose(candidates.entries()), _step16; !(_step16 = _iterator16()).done;) {
                  var _step16$value = _step16.value,
                    i = _step16$value[0],
                    _p = _step16$value[1];
                  add(i + 1, 1, _p.x, _p.y, {
                    velocityDuPerSecond: {
                      x: (_p.row % 3 - 1) * 0.25,
                      y: 0
                    },
                    hasEnteredCup: true,
                    dangerEligible: false
                  });
                }
                var minPairDistance = Math.min.apply(Math, candidates.reduce(function (all, p, i) {
                  return all.concat(candidates.slice(i + 1).map(function (q) {
                    return Math.hypot(p.x - q.x, p.y - q.y);
                  }));
                }, []));
                var minInteriorSideMargin = Math.min.apply(Math, candidates.reduce(function (all, p) {
                  return all.concat([leftInteriorMargin(p), rightInteriorMargin(p)]);
                }, []));
                var minEndpointClearance = Math.min.apply(Math, candidates.reduce(function (all, p) {
                  return all.concat([leftBottom, rightBottom, leftTop, rightTop].map(function (e) {
                    return Math.hypot(p.x - e.x, p.y - e.y) - _r43;
                  }));
                }, []));
                var minWallClearance = Math.min.apply(Math, candidates.reduce(function (all, p) {
                  return all.concat([_segmentDistance2(p, leftBottom, leftTop), _segmentDistance2(p, rightBottom, rightTop), p.y - bottomY, topY - p.y].map(function (d) {
                    return d - _r43;
                  }));
                }, []));
                if (minPairDistance < 2 * _r43 || minWallClearance < boundaryClearanceDu || minInteriorSideMargin < _r43 + boundaryClearanceDu || minEndpointClearance < boundaryClearanceDu) throw new Error('SAVE_COST_FIXTURE_GEOMETRY_INVALID');
                pattern = '220-config-derived-level1-dynamic-bodies-nonoverlap-finite-cup-interior-and-endpoint-clearance';
                geometry = {
                  count: candidates.length,
                  radiusDu: _r43,
                  clearanceGapDu: clearanceGapDu,
                  boundaryClearanceDu: boundaryClearanceDu,
                  minPairDistanceDu: minPairDistance,
                  minWallClearanceDu: minWallClearance,
                  minInteriorSideMarginDu: minInteriorSideMargin,
                  minEndpointClearanceDu: minEndpointClearance,
                  gridSpacingDu: {
                    x: dx,
                    y: _dy
                  },
                  allCentersInsideFiniteCup: true
                };
                break;
              }
            default:
              throw new Error("FIXTURE_NOT_IMPLEMENTED:" + fixtureId);
          }
          var next = _extends({}, base, {
            state: 'PAUSED',
            tick: tick,
            dangerTicks: dangerTicks,
            shake: shake,
            ingredients: states,
            nextEntityId: states.length + 1,
            maxLevel: Math.max.apply(Math, [1].concat(states.map(function (s) {
              return s.level;
            }))),
            terminalReason: null,
            settleStartedTick: null,
            lastDropTick: null,
            dropIndex: 0,
            rng: _extends({}, base.rng, {
              drawCount: 2
            }),
            checksum: ''
          });
          return {
            snapshot: SaveCodec.sealSnapshot(next),
            spec: {
              fixtureId: fixtureId,
              pattern: pattern,
              level: level,
              options: _extends({}, options),
              tick: tick,
              dangerTicks: dangerTicks,
              ingredients: states,
              geometry: geometry,
              configRulesHash: AppRuntime.configRulesHash
            }
          };
        };
        _proto.recordFrame = function recordFrame(dt, steps, before, cost, tick) {
          var _this$adapter$stepCou, _this$adapter, _this$adapter$entityC, _this$adapter2, _this$adapter$contact, _this$adapter3;
          if (this.probeMode() === 'off') return;
          var collectorStart = performance.now();
          var wall = Date.now();
          var row = {
            renderDt: dt,
            wallClock: wall,
            wallClockIntervalMs: this.priorFrameWall ? wall - this.priorFrameWall : 0,
            stepsThisFrame: steps,
            logicalTick: tick,
            engineTick: tick,
            adapterStep: (_this$adapter$stepCou = (_this$adapter = this.adapter) == null ? void 0 : _this$adapter.stepCount) != null ? _this$adapter$stepCou : 0,
            physicsMs: this.framePhysicsMs,
            logicMs: this.frameLogicMs,
            presentationMs: this.lastPresentationMs,
            probeMs: 0,
            collectorMs: 0,
            updateMs: cost,
            entities: (_this$adapter$entityC = (_this$adapter2 = this.adapter) == null ? void 0 : _this$adapter2.entityCount) != null ? _this$adapter$entityC : 0,
            contacts: (_this$adapter$contact = (_this$adapter3 = this.adapter) == null ? void 0 : _this$adapter3.contactCount) != null ? _this$adapter$contact : 0,
            saveMs: this.timingSaveMs,
            pauseReasons: Array.from(this.pauseOwners),
            ringOverflow: this.frames.overflowCount,
            screen: this.screen,
            hidden: HostLifecycleCoordinator.snapshot().backgrounded
          };
          this.priorFrameWall = wall;
          var record = this.frames.append(row);
          row.seq = record.seq;
          row.probeMs = performance.now() - collectorStart;
          row.collectorMs = row.probeMs;
        };
        _proto.recordPressureStep = function recordPressureStep(events) {
          var _this$adapter$cupSegm,
            _this$adapter4,
            _this$adapter$stepCou2,
            _this$adapter5,
            _this$adapter$getCont,
            _this$adapter6,
            _this33 = this;
          if (!this.pressureStepTraceEnabled || !this.engine || !AppRuntime.rules) return;
          var snap = this.engine.snapshot(),
            segments = (_this$adapter$cupSegm = (_this$adapter4 = this.adapter) == null ? void 0 : _this$adapter4.cupSegments) != null ? _this$adapter$cupSegm : [];
          var mapper = AppRuntime.mapper,
            linearSlopDu = mapper.box2DMetersToDu(0.008),
            polygonSkinDu = mapper.box2DMetersToDu(0.016);
          var solverResidualAllowanceDu = Math.max(0, 3 * linearSlopDu - polygonSkinDu),
            persistenceTicks = Math.max(1, Math.round(AppRuntime.rules.danger.spill_grace_seconds * AppRuntime.rules.physics.fixed_hz));
          var minSignedShape = Infinity,
            minSweep = Infinity,
            allFinite = true,
            fullyEscaped = false,
            finiteWallCrossing = false;
          var violations = [],
            entities = [],
            geometry = [],
            penetrationCounts = new Map();
          var walls = segments.map(function (s) {
            return {
              a: s.innerStart,
              b: s.innerEnd,
              outward: s.outward,
              thickness: s.thicknessDu,
              kind: s.kind
            };
          });
          var current = new Map();
          var _loop5 = function _loop5() {
            var _def$radius_du;
            var item = _step17.value;
            var def = AppRuntime.rules.ingredients.find(function (x) {
                return x.level === item.level;
              }),
              radius = (_def$radius_du = def == null ? void 0 : def.radius_du) != null ? _def$radius_du : NaN,
              p = _extends({}, item.positionDu),
              previous = _this33.pressurePreviousPositions.get(item.entityId);
            current.set(item.entityId, p);
            var finite = [p.x, p.y, item.velocityDuPerSecond.x, item.velocityDuPerSecond.y, item.angleRadians, item.angularVelocity, radius].every(Number.isFinite);
            allFinite && (allFinite = finite);
            if (!finite) {
              violations.push("non-finite:" + item.entityId);
              entities.push([item.entityId, item.level, p.x, p.y, item.velocityDuPerSecond.x, item.velocityDuPerSecond.y, radius]);
              return 1; // continue
            }

            var wallRows = walls.map(function (w) {
              var _this33$pressurePenet;
              var signedShapeClearanceDu = circleBoxClearance(p, w.a, w.b, w.outward, w.thickness, radius),
                centerOutwardDu = (p.x - w.a.x) * w.outward.x + (p.y - w.a.y) * w.outward.y;
              var length = Math.hypot(w.b.x - w.a.x, w.b.y - w.a.y),
                alongSegmentDu = length === 0 ? NaN : ((p.x - w.a.x) * (w.b.x - w.a.x) + (p.y - w.a.y) * (w.b.y - w.a.y)) / length;
              var key = item.entityId + ":" + w.kind,
                classification = classifyWallPenetration(signedShapeClearanceDu, solverResidualAllowanceDu, (_this33$pressurePenet = _this33.pressurePenetrationTicks.get(key)) != null ? _this33$pressurePenet : 0, persistenceTicks);
              var penetrationDepthDu = classification.penetrationDepthDu,
                consecutiveTicks = classification.consecutiveTicks;
              if (consecutiveTicks) _this33.pressurePenetrationTicks.set(key, consecutiveTicks);else _this33.pressurePenetrationTicks["delete"](key);
              penetrationCounts.set(key, consecutiveTicks);
              if (classification.persistent) violations.push("persistent-wall-penetration:" + item.entityId + ":" + w.kind);
              if (centerOutwardDu > radius) violations.push("body-center-entered-wall:" + item.entityId + ":" + w.kind);
              if (previous && crossesFiniteCupWall(previous, p, w.a, w.b, w.outward, w.thickness, radius)) {
                finiteWallCrossing = true;
                violations.push("finite-wall-crossing:" + item.entityId + ":" + w.kind);
              }
              var endpointMarginDu = Math.min(Math.hypot(p.x - w.a.x, p.y - w.a.y), Math.hypot(p.x - w.b.x, p.y - w.b.y)) - radius;
              var completeEscape = centerOutwardDu > w.thickness + radius && alongSegmentDu >= -w.thickness / 2 - radius && alongSegmentDu <= length + w.thickness / 2 + radius;
              fullyEscaped || (fullyEscaped = completeEscape);
              if (completeEscape) violations.push("complete-wall-escape:" + item.entityId + ":" + w.kind);
              return {
                kind: w.kind,
                signedShapeClearanceDu: signedShapeClearanceDu,
                penetrationDepthDu: penetrationDepthDu,
                solverResidualAllowanceDu: solverResidualAllowanceDu,
                consecutivePenetratingTicks: consecutiveTicks,
                centerOutwardDu: centerOutwardDu,
                alongSegmentDu: alongSegmentDu,
                endpointMarginDu: endpointMarginDu,
                thicknessDu: w.thickness,
                completeEscape: completeEscape
              };
            });
            var clearance = Math.min.apply(Math, wallRows.map(function (w) {
              return w.signedShapeClearanceDu;
            }));
            minSignedShape = Math.min(minSignedShape, clearance);
            var entitySweep = Infinity;
            if (previous) {
              for (var _iterator18 = _createForOfIteratorHelperLoose(walls), _step18; !(_step18 = _iterator18()).done;) {
                var w = _step18.value;
                var sweep = segmentDistance(previous, p, w.a, w.b) - radius;
                entitySweep = Math.min(entitySweep, sweep);
                minSweep = Math.min(minSweep, sweep);
              }
            }
            geometry.push({
              entityId: item.entityId,
              level: item.level,
              walls: wallRows,
              conservativeSweptClearanceDu: entitySweep,
              conservativeSweepIntersection: entitySweep < 0
            });
            entities.push([item.entityId, item.level, p.x, p.y, item.velocityDuPerSecond.x, item.velocityDuPerSecond.y, radius]);
          };
          for (var _iterator17 = _createForOfIteratorHelperLoose(snap.ingredients), _step17; !(_step17 = _iterator17()).done;) {
            if (_loop5()) continue;
          }
          this.pressurePreviousPositions = current;
          var legacyToleranceDu = 0.75;
          this.pressureStepTrace.append({
            logicalTick: snap.tick,
            adapterStep: (_this$adapter$stepCou2 = (_this$adapter5 = this.adapter) == null ? void 0 : _this$adapter5.stepCount) != null ? _this$adapter$stepCou2 : 0,
            entityCount: entities.length,
            allFinite: allFinite,
            minActualShapeClearanceDu: minSignedShape,
            legacy075Exceeded: minSignedShape < -legacyToleranceDu,
            legacyToleranceDu: legacyToleranceDu,
            backendContact: {
              sourcePackage: '@cocos/box2d@1.0.2',
              linearSlopMeters: 0.008,
              linearSlopDu: linearSlopDu,
              polygonSkinMeters: 0.016,
              polygonSkinDu: polygonSkinDu,
              positionSolverMinSeparationLimitSlop: 3,
              solverResidualAllowanceDu: solverResidualAllowanceDu,
              persistenceTicks: persistenceTicks,
              persistenceSeconds: persistenceTicks / AppRuntime.rules.physics.fixed_hz
            },
            persistentPenetrationCounts: Array.from(penetrationCounts.entries()).reduce(function (result, _ref15) {
              var key = _ref15[0],
                value = _ref15[1];
              result[key] = value;
              return result;
            }, {}),
            completeWallEscape: fullyEscaped,
            finiteWallCrossing: finiteWallCrossing,
            conservativeSweptCenterlineDistanceMinusRadiusDu: minSweep,
            geometry: geometry,
            actualContacts: (_this$adapter$getCont = (_this$adapter6 = this.adapter) == null ? void 0 : _this$adapter6.getContacts().map(function (c) {
              return _extends({}, c);
            })) != null ? _this$adapter$getCont : [],
            tickEvents: events.map(function (event) {
              return _extends({}, event);
            }),
            violations: violations
          });
          if (!allFinite || violations.length) {
            var _this$clock14;
            (_this$clock14 = this.clock) == null || _this$clock14.pause();
            this.pauseOwners.add('TECHNICAL_ERROR');
            this.engine.pause('TECHNICAL_ERROR');
            this.screen = 'PAUSED';
            this.notice = "\u538B\u529B\u8F68\u8FF9\u9996\u6B21\u51E0\u4F55\u5F02\u5E38\uFF0C\u5DF2\u51BB\u7ED3\u4E8Etick " + snap.tick;
            this.render();
          }
        };
        _proto.advanceRunTick = function advanceRunTick() {
          var _this$engine$advanceO, _this$engine33, _this$lastEvents;
          var events = (_this$engine$advanceO = (_this$engine33 = this.engine) == null ? void 0 : _this$engine33.advanceOneTick()) != null ? _this$engine$advanceO : [];
          if (this.engine) {
            var _this$clock15;
            this.readContactFeedback();
            this.framePhysicsMs += this.engine.lastPhysicsMs;
            this.frameLogicMs += this.engine.lastLogicMs;
            if (this.engine.phase === 'SETTLING' || this.engine.spillPending) (_this$clock15 = this.clock) == null || _this$clock15.pause();
            this.recordPressureStep(events);
            if (this.engine.lastTickFault) {
              var _this$clock16;
              (_this$clock16 = this.clock) == null || _this$clock16.pause();
              this.pauseOwners.add('TECHNICAL_ERROR');
              this.cancelPointer();
              this.screen = 'ERROR';
              var rollbackFailed = this.engine.lastTickFault.includes('|ROLLBACK:');
              this.notice = rollbackFailed ? '本局恢复未完成，原存档保持不变。错误编号 PHYSICS_ROLLBACK_FAILED' : '本局遇到问题，已恢复到上一个完整物理步。错误编号 PHYSICS_TICK_ROLLED_BACK';
              if (rollbackFailed) this.saveDirty = false;else {
                this.saveDirty = true;
                void this.commitCheckpoint(true);
              }
              this.frames.append({
                kind: 'technical-fault',
                code: rollbackFailed ? 'PHYSICS_ROLLBACK_FAILED' : 'PHYSICS_TICK_ROLLED_BACK',
                tick: this.engine.tick
              });
              this.render();
              return false;
            }
            if (this.dangerStepTraceEnabled) {
              var _this$adapter$stepCou3, _this$adapter7, _this$adapter$contact2, _this$adapter8, _this$adapter$contact3, _this$adapter9;
              var snap = this.engine.snapshot();
              var dangerBodies = snap.ingredients.filter(function (i) {
                var _ingredients$find$rad2, _ingredients$find2;
                return i.dangerEligible && i.positionDu.y + ((_ingredients$find$rad2 = (_ingredients$find2 = AppRuntime.rules.ingredients.find(function (v) {
                  return v.level === i.level;
                })) == null ? void 0 : _ingredients$find2.radius_du) != null ? _ingredients$find$rad2 : 0) > AppRuntime.rules.cup.danger_line_y_du;
              }).map(function (i) {
                var _ingredients$find$rad3, _ingredients$find3;
                return {
                  entityId: i.entityId,
                  level: i.level,
                  topY: i.positionDu.y + ((_ingredients$find$rad3 = (_ingredients$find3 = AppRuntime.rules.ingredients.find(function (v) {
                    return v.level === i.level;
                  })) == null ? void 0 : _ingredients$find3.radius_du) != null ? _ingredients$find$rad3 : 0),
                  eligible: i.dangerEligible
                };
              });
              this.dangerStepTrace.append({
                logicalTick: snap.tick,
                adapterStep: (_this$adapter$stepCou3 = (_this$adapter7 = this.adapter) == null ? void 0 : _this$adapter7.stepCount) != null ? _this$adapter$stepCou3 : 0,
                dangerTicks: snap.dangerTicks,
                phase: snap.state,
                terminalReason: snap.terminalReason,
                runEnded: events.filter(function (e) {
                  return e.kind === 'RunEnded';
                }).map(function (e) {
                  return {
                    eventId: e.eventId,
                    reason: e.reason,
                    tick: e.tick
                  };
                }),
                dangerBodies: dangerBodies,
                ingredients: snap.ingredients.map(function (i) {
                  return {
                    entityId: i.entityId,
                    level: i.level,
                    x: i.positionDu.x,
                    y: i.positionDu.y,
                    vx: i.velocityDuPerSecond.x,
                    vy: i.velocityDuPerSecond.y,
                    eligible: i.dangerEligible,
                    sleeping: i.sleeping
                  };
                }),
                contactCount: (_this$adapter$contact2 = (_this$adapter8 = this.adapter) == null ? void 0 : _this$adapter8.contactCount) != null ? _this$adapter$contact2 : 0,
                contactBeginEvents: (_this$adapter$contact3 = (_this$adapter9 = this.adapter) == null ? void 0 : _this$adapter9.contactBeginEvents) != null ? _this$adapter$contact3 : 0,
                physicsMs: this.engine.lastPhysicsMs,
                logicMs: this.engine.lastLogicMs
              });
            }
          }
          (_this$lastEvents = this.lastEvents).push.apply(_this$lastEvents, events);
          return true;
        };
        _proto.publishDiagnostics = function publishDiagnostics() {
          var _this34 = this;
          var w = globalThis;
          w.__P1B_DIAGNOSTICS__ = {
            identity: function identity() {
              var _this34$diagnosticAtt, _AppRuntime$mapper;
              return {
                buildId: AppRuntime.buildId,
                attemptId: (_this34$diagnosticAtt = _this34.diagnosticAttemptId) != null ? _this34$diagnosticAtt : new URLSearchParams(location.search).get('attemptId'),
                probeVersion: 'p1b-probe-v3',
                sceneId: _this34.sceneId,
                cocos: '3.8.8',
                box2d: '1.0.2',
                ptm: (_AppRuntime$mapper = AppRuntime.mapper) == null ? void 0 : _AppRuntime$mapper.cocosPtmRatio,
                autoSimulation: false,
                configRulesHash: AppRuntime.configRulesHash,
                worldId: _this34.worldId
              };
            },
            snapshot: function snapshot() {
              var _this34$engine$snapsh, _this34$engine;
              return (_this34$engine$snapsh = (_this34$engine = _this34.engine) == null ? void 0 : _this34$engine.snapshot()) != null ? _this34$engine$snapsh : null;
            },
            readFrames: function readFrames(after, limit) {
              if (after === void 0) {
                after = 0;
              }
              if (limit === void 0) {
                limit = 256;
              }
              return _this34.frames.page(after, limit).records.map(function (row) {
                return _extends({
                  seq: row.seq
                }, row.value);
              });
            },
            readCommands: function readCommands(after, limit) {
              if (after === void 0) {
                after = 0;
              }
              if (limit === void 0) {
                limit = 256;
              }
              return _this34.commands.page(after, limit).records.map(function (row) {
                return {
                  seq: row.seq,
                  command: row.value
                };
              });
            },
            readEvents: function readEvents(after, limit) {
              if (after === void 0) {
                after = 0;
              }
              if (limit === void 0) {
                limit = 256;
              }
              return _this34.events.page(after, limit).records.map(function (row) {
                return {
                  seq: row.seq,
                  event: row.value
                };
              });
            },
            readFramePage: function readFramePage(cursor, limit) {
              if (cursor === void 0) {
                cursor = 0;
              }
              if (limit === void 0) {
                limit = 256;
              }
              var p = _this34.frames.page(cursor, limit);
              return _extends({}, p, {
                records: p.records.map(function (row) {
                  return _extends({
                    seq: row.seq
                  }, row.value);
                })
              });
            },
            readCommandPage: function readCommandPage(cursor, limit) {
              if (cursor === void 0) {
                cursor = 0;
              }
              if (limit === void 0) {
                limit = 256;
              }
              var p = _this34.commands.page(cursor, limit);
              return _extends({}, p, {
                records: p.records.map(function (row) {
                  return {
                    seq: row.seq,
                    command: row.value
                  };
                })
              });
            },
            readEventPage: function readEventPage(cursor, limit) {
              if (cursor === void 0) {
                cursor = 0;
              }
              if (limit === void 0) {
                limit = 256;
              }
              var p = _this34.events.page(cursor, limit);
              return _extends({}, p, {
                records: p.records.map(function (row) {
                  return {
                    seq: row.seq,
                    event: row.value
                  };
                })
              });
            },
            readDangerStepPage: function readDangerStepPage(cursor, limit) {
              if (cursor === void 0) {
                cursor = 0;
              }
              if (limit === void 0) {
                limit = 256;
              }
              var p = _this34.dangerStepTrace.page(cursor, limit);
              return _extends({}, p, {
                records: p.records.map(function (row) {
                  return _extends({
                    seq: row.seq
                  }, row.value);
                })
              });
            },
            readPressureStepPage: function readPressureStepPage(cursor, limit) {
              if (cursor === void 0) {
                cursor = 0;
              }
              if (limit === void 0) {
                limit = 128;
              }
              var p = _this34.pressureStepTrace.page(cursor, limit);
              return _extends({}, p, {
                records: p.records.map(function (row) {
                  return _extends({
                    seq: row.seq
                  }, row.value);
                })
              });
            },
            readFixtureAccelerationProbe: function readFixtureAccelerationProbe() {
              var _this34$adapter$readF, _this34$adapter;
              return (_this34$adapter$readF = (_this34$adapter = _this34.adapter) == null ? void 0 : _this34$adapter.readFixtureAccelerationProbe()) != null ? _this34$adapter$readF : [];
            },
            readFixtureMergeProbe: function readFixtureMergeProbe() {
              var _this34$adapter$readF2, _this34$adapter2;
              return (_this34$adapter$readF2 = (_this34$adapter2 = _this34.adapter) == null ? void 0 : _this34$adapter2.readFixtureMergeProbe()) != null ? _this34$adapter$readF2 : [];
            },
            readFixtureWallProbe: function readFixtureWallProbe() {
              var _this34$adapter$readF3, _this34$adapter3;
              return (_this34$adapter$readF3 = (_this34$adapter3 = _this34.adapter) == null ? void 0 : _this34$adapter3.readFixtureWallProbe()) != null ? _this34$adapter$readF3 : [];
            },
            readFixtureWallGeometry: function readFixtureWallGeometry() {
              var _this34$adapter$readF4, _this34$adapter4;
              return (_this34$adapter$readF4 = (_this34$adapter4 = _this34.adapter) == null ? void 0 : _this34$adapter4.readFixtureWallGeometry()) != null ? _this34$adapter$readF4 : [];
            },
            readLifecycle: function readLifecycle() {
              return HostLifecycleCoordinator.snapshot();
            },
            status: function status() {
              var _this34$engine$phase, _this34$engine2, _this34$clock, _this34$adapter$stepC, _this34$adapter5, _this34$clock$tick, _this34$clock2, _this34$engine$tick, _this34$engine3, _this34$engine$curren, _this34$engine4, _this34$engine$lastTi, _this34$engine5, _this34$adapter$conta, _this34$adapter6, _this34$adapter$conta2, _this34$adapter7, _this34$adapter$conta3, _this34$adapter8, _this34$adapter$fixtu, _this34$adapter9, _this34$adapter$liste, _this34$adapter10;
              return {
                screen: _this34.screen,
                phase: (_this34$engine$phase = (_this34$engine2 = _this34.engine) == null ? void 0 : _this34$engine2.phase) != null ? _this34$engine$phase : 'MENU',
                paused: !!((_this34$clock = _this34.clock) != null && _this34$clock.paused),
                pauseReasons: Array.from(_this34.pauseOwners),
                stepCount: (_this34$adapter$stepC = (_this34$adapter5 = _this34.adapter) == null ? void 0 : _this34$adapter5.stepCount) != null ? _this34$adapter$stepC : 0,
                clockTick: (_this34$clock$tick = (_this34$clock2 = _this34.clock) == null ? void 0 : _this34$clock2.tick) != null ? _this34$clock$tick : 0,
                baseTick: _this34.baseTick,
                tick: (_this34$engine$tick = (_this34$engine3 = _this34.engine) == null ? void 0 : _this34$engine3.tick) != null ? _this34$engine$tick : 0,
                lastCommandOutcome: (_this34$engine$curren = (_this34$engine4 = _this34.engine) == null ? void 0 : _this34$engine4.currentOutcome) != null ? _this34$engine$curren : null,
                lastTickFault: (_this34$engine$lastTi = (_this34$engine5 = _this34.engine) == null ? void 0 : _this34$engine5.lastTickFault) != null ? _this34$engine$lastTi : null,
                contactCount: (_this34$adapter$conta = (_this34$adapter6 = _this34.adapter) == null ? void 0 : _this34$adapter6.contactCount) != null ? _this34$adapter$conta : 0,
                contactBeginEvents: (_this34$adapter$conta2 = (_this34$adapter7 = _this34.adapter) == null ? void 0 : _this34$adapter7.contactBeginEvents) != null ? _this34$adapter$conta2 : 0,
                contactEndEvents: (_this34$adapter$conta3 = (_this34$adapter8 = _this34.adapter) == null ? void 0 : _this34$adapter8.contactEndEvents) != null ? _this34$adapter$conta3 : 0,
                contactEnumeration: (_this34$adapter$fixtu = (_this34$adapter9 = _this34.adapter) == null ? void 0 : _this34$adapter9.fixtureContactEnumeration) != null ? _this34$adapter$fixtu : null,
                listenerCount: (_this34$adapter$liste = (_this34$adapter10 = _this34.adapter) == null ? void 0 : _this34$adapter10.listenerCount) != null ? _this34$adapter$liste : 0,
                worldId: _this34.worldId,
                notice: _this34.notice,
                saveRevision: _this34.bundleRevision,
                saveMode: _this34.debugMode ? 'attempt-scoped-debug' : _this34.persistent ? 'persistent' : 'memory-only'
              };
            },
            enqueue: function enqueue(command) {
              var _this34$engine$dispat, _this34$engine6;
              return (_this34$engine$dispat = (_this34$engine6 = _this34.engine) == null ? void 0 : _this34$engine6.dispatch({
                command: command,
                ownerEpoch: _this34.engine.snapshot().epoch
              })) != null ? _this34$engine$dispat : {
                ok: false,
                error: {
                  code: 'NO_RUN',
                  message: 'no active run',
                  retryable: false
                }
              };
            },
            verifyResumeTransitions: function verifyResumeTransitions() {
              return HostLifecycleCoordinator.verifyResumeTransitionsForTests();
            },
            replayLastConsumedMerge: function replayLastConsumedMerge() {
              var _this34$lastConsumedD, _this34$engine7, _this34$engine8;
              if (!_this34.debugMode || ((_this34$lastConsumedD = _this34.lastConsumedDomainEvent) == null ? void 0 : _this34$lastConsumedD.kind) !== 'MergeCommitted') throw new Error('SEALED_MERGE_EVENT_REQUIRED');
              var event = _this34.lastConsumedDomainEvent,
                before = {
                  eventSeq: _this34.events.latestSeq,
                  score: (_this34$engine7 = _this34.engine) == null ? void 0 : _this34$engine7.snapshot().score,
                  saveRevision: _this34.bundleRevision,
                  saveDirty: _this34.saveDirty
                };
              _this34.lastEvents.push(event);
              _this34.processEvents();
              return {
                eventId: event.eventId,
                before: before,
                after: {
                  eventSeq: _this34.events.latestSeq,
                  score: (_this34$engine8 = _this34.engine) == null ? void 0 : _this34$engine8.snapshot().score,
                  saveRevision: _this34.bundleRevision,
                  saveDirty: _this34.saveDirty
                }
              };
            }
          };
          w.__P1B_FIXTURES__ = {
            version: 'p1b-fixture-v13',
            supported: ['empty', 'shake-empty', 'shake-sample', 'initial-preview', 'control-pump', 'control-preempt', 'clock-restore', 'restart-confirm', 'score-replay', 'five-substeps', 'uuid', 'view-only', 'settlement-retry', 'shake-two', 'shake-child', 'shake-rapid', 'shake-cooldown', 'shake-drop', 'shake-pause', 'shake-mass', 'shake-sleep', 'create-fault', 'commit-fault', 'stale-contact', 'roundtrip', 'cleanup20', 'level-pairs', 'level-pair', 'three', 'four', 'mixed-level', 'max-level', 'wall-projection', 'next-generation', 'merge-wall-impact', 'multi-contact', 'multi-pair', 'tie-order', 'persistent', 'inheritance', 'weighted-state', 'neighbor-overlap', 'angular-unit', 'linear-limit', 'contact-grace', 'grace', 'danger-line', 'danger-supported-continuous', 'danger-supported-continuous-shortcup', 'danger-reset', 'danger-alternate', 'danger-during-shake', 'entered', 'merge-before-danger', 'merge-danger-inherit', 'spill-child', 'terminal-priority', 'side-escape', 'mochi-milestone', 'danger179', 'danger180', 'spill-never-entered', 'spill-return', 'spill-threshold', 'revive-candidate', 'blocked-spawn', 'spawn-boundary', 'spawn-tangent', 'save-cost-220'],
            start: function () {
              var _start = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee24(_ref16) {
                var _this34$clock3;
                var attemptId, _ref16$seed, seed, _ref16$fixtureId, fixtureId, storageNamespace, _ref16$fixtureOptions, fixtureOptions, namespace, lease, base, created, runId, adapter, host, snapshot, fixtureBundle, fixtureCommit, fixtureHash;
                return _regeneratorRuntime().wrap(function _callee24$(_context24) {
                  while (1) switch (_context24.prev = _context24.next) {
                    case 0:
                      attemptId = _ref16.attemptId, _ref16$seed = _ref16.seed, seed = _ref16$seed === void 0 ? 1 : _ref16$seed, _ref16$fixtureId = _ref16.fixtureId, fixtureId = _ref16$fixtureId === void 0 ? 'empty' : _ref16$fixtureId, storageNamespace = _ref16.storageNamespace, _ref16$fixtureOptions = _ref16.fixtureOptions, fixtureOptions = _ref16$fixtureOptions === void 0 ? {} : _ref16$fixtureOptions;
                      if (!(!attemptId || !/^[A-Za-z0-9._-]+$/.test(attemptId))) {
                        _context24.next = 3;
                        break;
                      }
                      throw new Error('valid attemptId required');
                    case 3:
                      if (w.__P1B_FIXTURES__.supported.includes(fixtureId)) {
                        _context24.next = 5;
                        break;
                      }
                      throw new Error("FIXTURE_NOT_IMPLEMENTED:" + fixtureId);
                    case 5:
                      namespace = storageNamespace != null ? storageNamespace : "attempt-" + attemptId;
                      if (!(namespace !== "attempt-" + attemptId)) {
                        _context24.next = 8;
                        break;
                      }
                      throw new Error('debug storage namespace must be attempt scoped');
                    case 8:
                      if (!(!Number.isSafeInteger(seed) || seed <= 0 || seed > 0xffffffff)) {
                        _context24.next = 10;
                        break;
                      }
                      throw new Error('seed must be uint32 nonzero');
                    case 10:
                      _this34.debugLease == null || _this34.debugLease();
                      _this34.debugLease = null;
                      _this34.debugRepo = new LocalSaveRepository(namespace);
                      _this34.debugNamespace = namespace;
                      _context24.next = 16;
                      return _this34.debugRepo.acquireWriteLease();
                    case 16:
                      lease = _context24.sent;
                      if (!(!lease.ok || lease.data.mode !== 'persistent')) {
                        _context24.next = 21;
                        break;
                      }
                      _this34.debugRepo = null;
                      _this34.debugNamespace = null;
                      throw new Error("DEBUG_LEASE_UNAVAILABLE:" + (lease.ok ? 'memory-only' : lease.error.code));
                    case 21:
                      _this34.debugLease = lease.data.release;
                      _this34.debugMode = true;
                      _this34.diagnosticAttemptId = attemptId;
                      _context24.next = 26;
                      return _this34.startNew(true, seed, attemptId);
                    case 26:
                      if (!(!_this34.engine || !_this34.adapter)) {
                        _context24.next = 28;
                        break;
                      }
                      throw new Error('FIXTURE_START_DID_NOT_CREATE_OWNER');
                    case 28:
                      base = _this34.engine.snapshot(), created = _this34.makeFixtureSnapshot(base, fixtureId, fixtureOptions);
                      (_this34$clock3 = _this34.clock) == null || _this34$clock3.pause();
                      _this34.engine.dispose();
                      runId = created.snapshot.runId, adapter = _this34.createWorld();
                      if (['shake-sample', 'shake-mass', 'shake-child', 'shake-sleep', 'shake-pause'].includes(fixtureId)) adapter.enableFixtureAccelerationProbe();
                      if (['inheritance', 'weighted-state', 'neighbor-overlap', 'linear-limit', 'merge-danger-inherit', 'spill-child', 'score-replay', 'five-substeps', 'uuid', 'wall-projection'].includes(fixtureId)) adapter.enableFixtureMergeProbe();
                      if (fixtureId === 'wall-projection') adapter.enableFixtureWallProbe();
                      if (fixtureId === 'tie-order') adapter.setContactEnumerationReversedForFixture(fixtureOptions.contactOrder === 'reverse');
                      _this34.adapter = adapter;
                      _this34.engine = new RunEngine(adapter, AppRuntime.rules, runId, seed, created.snapshot, _this34.reviveOptions());
                      _this34.engine.setTimingDiagnostics(_this34.probeMode() !== 'off');
                      _this34.baseTick = created.snapshot.tick;
                      if (fixtureId === 'create-fault') adapter.setFixtureMergeFaultOnce('create-child-once');
                      if (fixtureId === 'commit-fault') adapter.setFixtureMergeFaultOnce('second-commit-once');
                      _this34.clock = new FixedClock(AppRuntime.rules.physics.fixed_hz, AppRuntime.rules.physics.max_catchup_steps, function () {
                        return _this34.advanceRunTick();
                      });
                      _this34.clock.pause();
                      _this34.pauseOwners.clear();
                      host = HostLifecycleCoordinator.snapshot();
                      if (host.resumeRequired) _this34.pauseOwners.add('RESUME_REQUIRED');
                      if (host.backgrounded) _this34.pauseOwners.add('HOST_HIDDEN');
                      if (host.backgrounded) _this34.engine.pause('HOST_HIDDEN');else if (host.resumeRequired) _this34.engine.pause('RESUME_REQUIRED');
                      _this34.bundle = _extends({}, _this34.bundle, {
                        run: created.snapshot
                      });
                      _this34.lastSaveTick = created.snapshot.tick;
                      _this34.screen = 'PAUSED';
                      _this34.render();
                      _this34.dangerStepTrace.clear();
                      _this34.dangerStepTraceEnabled = _this34.probeMode() === 'full' && ['danger-supported-continuous', 'danger-supported-continuous-shortcup', 'danger-reset', 'danger-alternate', 'danger-during-shake', 'entered', 'merge-before-danger', 'merge-danger-inherit', 'grace', 'danger-line', 'spill-never-entered', 'spill-return', 'spill-child', 'terminal-priority'].includes(fixtureId);
                      _this34.pressureStepTrace.clear();
                      _this34.pressureStepTraceEnabled = _this34.probeMode() === 'full' && (fixtureId === 'save-cost-220' || fixtureId === 'merge-wall-impact' || fixtureId === 'wall-projection' || fixtureId === 'side-escape');
                      _this34.pressurePreviousPositions = new Map(created.snapshot.ingredients.map(function (i) {
                        return [i.entityId, _extends({}, i.positionDu)];
                      }));
                      _this34.pressurePenetrationTicks.clear();
                      snapshot = _this34.engine.snapshot();
                      fixtureBundle = _extends({}, _this34.bundle, {
                        profile: _extends({}, _this34.bundle.profile, {
                          activeRunId: snapshot.runId
                        }),
                        run: snapshot,
                        lastResult: null
                      });
                      _context24.next = 63;
                      return _this34.debugRepo.commitBundle(0, null, fixtureBundle);
                    case 63:
                      fixtureCommit = _context24.sent;
                      if (fixtureCommit.ok) {
                        _context24.next = 66;
                        break;
                      }
                      throw new Error("DEBUG_FIXTURE_INITIAL_SAVE_FAILED:" + fixtureCommit.error.message);
                    case 66:
                      _this34.bundleRevision = fixtureCommit.data.revision;
                      fixtureHash = sha256Utf8(SaveCodec.canonicalJson({
                        seed: seed,
                        namespace: namespace,
                        spec: created.spec,
                        version: 'p1b-fixture-v13'
                      }));
                      return _context24.abrupt("return", {
                        attemptId: attemptId,
                        fixtureId: fixtureId,
                        seed: seed,
                        namespace: namespace,
                        fixtureHash: fixtureHash,
                        fixtureSpec: created.spec,
                        buildId: AppRuntime.buildId,
                        debugRevision: fixtureCommit.data.revision,
                        owner: {
                          sceneLifetimeId: _this34.sceneId,
                          runId: snapshot.runId,
                          epoch: snapshot.epoch,
                          worldId: _this34.worldId
                        },
                        status: 'started-paused',
                        storageMode: 'attempt-scoped-debug-repository',
                        snapshot: snapshot
                      });
                    case 69:
                    case "end":
                      return _context24.stop();
                  }
                }, _callee24);
              }));
              function start(_x11) {
                return _start.apply(this, arguments);
              }
              return start;
            }(),
            enqueue: function enqueue(command) {
              return w.__P1B_DIAGNOSTICS__.enqueue(command);
            },
            injectFault: function injectFault(_ref17) {
              var point = _ref17.point;
              if (!_this34.debugRepo) throw new Error('DEBUG_FIXTURE_NOT_STARTED');
              _this34.debugRepo.injectFaultOnce(point);
            },
            readDebugBundle: function () {
              var _readDebugBundle = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee25() {
                return _regeneratorRuntime().wrap(function _callee25$(_context25) {
                  while (1) switch (_context25.prev = _context25.next) {
                    case 0:
                      if (_this34.debugRepo) {
                        _context25.next = 2;
                        break;
                      }
                      throw new Error('DEBUG_FIXTURE_NOT_STARTED');
                    case 2:
                      return _context25.abrupt("return", _this34.debugRepo.readBundle());
                    case 3:
                    case "end":
                      return _context25.stop();
                  }
                }, _callee25);
              }));
              function readDebugBundle() {
                return _readDebugBundle.apply(this, arguments);
              }
              return readDebugBundle;
            }(),
            commitDebugBundle: function () {
              var _commitDebugBundle = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee26(_ref18) {
                var expectedRevision, expectedRunId, next;
                return _regeneratorRuntime().wrap(function _callee26$(_context26) {
                  while (1) switch (_context26.prev = _context26.next) {
                    case 0:
                      expectedRevision = _ref18.expectedRevision, expectedRunId = _ref18.expectedRunId, next = _ref18.next;
                      if (_this34.debugRepo) {
                        _context26.next = 3;
                        break;
                      }
                      throw new Error('DEBUG_FIXTURE_NOT_STARTED');
                    case 3:
                      return _context26.abrupt("return", _this34.debugRepo.commitBundle(expectedRevision, expectedRunId, next));
                    case 4:
                    case "end":
                      return _context26.stop();
                  }
                }, _callee26);
              }));
              function commitDebugBundle(_x12) {
                return _commitDebugBundle.apply(this, arguments);
              }
              return commitDebugBundle;
            }(),
            rebuildOwnedWorld: function rebuildOwnedWorld() {
              if (!_this34.debugMode || !_this34.engine || !_this34.adapter || !_this34.clock) throw new Error('DEBUG_REBUILD_OWNER_REQUIRED');
              var prior = _this34.engine.snapshot(),
                oldAdapter = _this34.adapter,
                oldWorldId = _this34.worldId;
              _this34.clock.pause();
              _this34.engine.dispose();
              var staleAfterDispose = oldAdapter.replayStaleContactCallbacksForTest();
              var adapter = _this34.createWorld();
              _this34.adapter = adapter;
              _this34.engine = new RunEngine(adapter, AppRuntime.rules, prior.runId, prior.rng.state, prior, _this34.reviveOptions());
              _this34.engine.setTimingDiagnostics(_this34.probeMode() !== 'off');
              _this34.baseTick = prior.tick;
              _this34.clock = new FixedClock(AppRuntime.rules.physics.fixed_hz, AppRuntime.rules.physics.max_catchup_steps, function () {
                return _this34.advanceRunTick();
              });
              _this34.clock.pause();
              _this34.pauseOwners = new Set(['MANUAL']);
              _this34.engine.pause('MANUAL');
              _this34.screen = 'PAUSED';
              _this34.bundle = _extends({}, _this34.bundle, {
                run: _this34.engine.snapshot()
              });
              _this34.render();
              return {
                oldWorldId: oldWorldId,
                newWorldId: _this34.worldId,
                oldRunId: prior.runId,
                staleAfterDispose: staleAfterDispose,
                restored: _this34.engine.snapshot(),
                status: w.__P1B_DIAGNOSTICS__.status()
              };
            },
            stop: function stop() {
              var _this34$clock4, _this34$engine9;
              _this34.cancelPointer();
              _this34.dangerStepTraceEnabled = false;
              _this34.pressureStepTraceEnabled = false;
              _this34.pressurePreviousPositions.clear();
              _this34.pressurePenetrationTicks.clear();
              (_this34$clock4 = _this34.clock) == null || _this34$clock4.pause();
              (_this34$engine9 = _this34.engine) == null || _this34$engine9.pause('TECHNICAL_ERROR');
              _this34.debugLease == null || _this34.debugLease();
              _this34.debugLease = null;
              _this34.debugRepo = null;
              _this34.debugNamespace = null;
              _this34.debugMode = false;
            }
          };
        };
        _proto.probeMode = function probeMode() {
          return this.probeSetting;
        };
        _proto.levelName = function levelName(level) {
          var _ingredients$find$nam, _ingredients$find4;
          return (_ingredients$find$nam = (_ingredients$find4 = AppRuntime.rules.ingredients.find(function (i) {
            return i.level === level;
          })) == null ? void 0 : _ingredients$find4.name) != null ? _ingredients$find$nam : "\u7B49\u7EA7" + level;
        };
        _proto.makeUuid = function makeUuid() {
          var c = globalThis.crypto;
          if (c != null && c.randomUUID) return c.randomUUID();
          var bytes = new Uint8Array(16);
          if (c != null && c.getRandomValues) c.getRandomValues(bytes);else for (var i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
          bytes[6] = bytes[6] & 15 | 64;
          bytes[8] = bytes[8] & 63 | 128;
          var h = Array.from(bytes, function (v) {
            return v.toString(16).padStart(2, '0');
          }).join('');
          return h.slice(0, 8) + "-" + h.slice(8, 12) + "-" + h.slice(12, 16) + "-" + h.slice(16, 20) + "-" + h.slice(20);
        }
        // Run IDs and initial gameplay seeds are local identities, never account or authentication tokens.
        ;

        _proto.seed = function seed() {
          var _globalThis$crypto;
          var a = new Uint32Array(1);
          if ((_globalThis$crypto = globalThis.crypto) != null && _globalThis$crypto.getRandomValues) globalThis.crypto.getRandomValues(a);else a[0] = Math.floor(Math.random() * 0x100000000);
          return a[0] || 1;
        };
        _proto.enterTechnicalError = function enterTechnicalError(message) {
          var _this$clock17, _this$engine34;
          (_this$clock17 = this.clock) == null || _this$clock17.pause();
          (_this$engine34 = this.engine) == null || _this$engine34.pause('TECHNICAL_ERROR');
          this.pauseOwners.add('TECHNICAL_ERROR');
          this.screen = 'ERROR';
          this.notice = "\u7269\u7406/\u8FD0\u884C\u9519\u8BEF\u5DF2\u51BB\u7ED3\u73B0\u573A\uFF1A" + message;
          void this.commitCheckpoint(true);
          this.render();
        };
        return GameRoot;
      }(Component), _class2.nextSceneId = 1, _class2.nextWorldId = 1, _class2)) || _class));
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/HostLifecycleCoordinator.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
  var _createClass, _createForOfIteratorHelperLoose, cclegacy, game, Game;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
      game = module.game;
      Game = module.Game;
    }],
    execute: function () {
      var _class2;
      cclegacy._RF.push({}, "3f5cfo+HdxAQKyMI5gYetCy", "HostLifecycleCoordinator", undefined);
      /** Sticky foreground acknowledgement state. Scene lifetime is deliberately not represented here. */
      var HostResumeLatch = exports('HostResumeLatch', /*#__PURE__*/function () {
        function HostResumeLatch() {
          this._backgrounded = false;
          this._resumeRequired = false;
          this._hideEpoch = 0;
          this._confirmedHideEpoch = 0;
        }
        var _proto = HostResumeLatch.prototype;
        _proto.setBackgrounded = function setBackgrounded(backgrounded) {
          if (backgrounded === this._backgrounded) return false;
          this._backgrounded = backgrounded;
          if (backgrounded) {
            this._hideEpoch++;
            this._resumeRequired = true;
          }
          return true;
        };
        _proto.confirmResume = function confirmResume(expectedHideEpoch, ready, visible, guardsClear) {
          if (!ready) return {
            ok: false,
            reason: 'INITIALIZING',
            confirmed: false
          };
          if (!visible || this._backgrounded) return {
            ok: false,
            reason: 'BACKGROUND',
            confirmed: false
          };
          if (!guardsClear) return {
            ok: false,
            reason: 'PAUSE_GUARD',
            confirmed: false
          };
          if (!this._resumeRequired) return {
            ok: true,
            reason: null,
            confirmed: false
          };
          if (expectedHideEpoch !== this._hideEpoch) return {
            ok: false,
            reason: 'STALE_HIDE_EPOCH',
            confirmed: false
          };
          this._resumeRequired = false;
          this._confirmedHideEpoch = expectedHideEpoch;
          return {
            ok: true,
            reason: null,
            confirmed: true
          };
        };
        HostResumeLatch.verifyTransitions = function verifyTransitions() {
          var state = new HostResumeLatch();
          var checks = {};
          checks.normalStartupStaysOpen = !state.resumeRequired && state.hideEpoch === 0;
          state.setBackgrounded(true);
          var firstHideEpoch = state.hideEpoch;
          state.setBackgrounded(false);
          checks.showDoesNotAcknowledge = state.resumeRequired && state.hideEpoch === firstHideEpoch;
          checks.notReadyCannotAcknowledge = !state.confirmResume(firstHideEpoch, false, true, true).ok && state.resumeRequired;
          checks.galleryGuardCannotAcknowledge = !state.confirmResume(firstHideEpoch, true, true, false).ok && state.resumeRequired;
          checks.validResumeConfirmsCurrentHide = state.confirmResume(firstHideEpoch, true, true, true).confirmed && !state.resumeRequired && state.confirmedHideEpoch === firstHideEpoch;
          state.setBackgrounded(true);
          var secondHideEpoch = state.hideEpoch;
          state.setBackgrounded(false);
          checks.oldResumeCannotClearNewHide = secondHideEpoch > firstHideEpoch && !state.confirmResume(firstHideEpoch, true, true, true).ok && state.resumeRequired;
          checks.hiddenCannotAcknowledge = !state.confirmResume(secondHideEpoch, true, false, true).ok && state.resumeRequired;
          checks.newValidResumeConfirmsNewHide = state.confirmResume(secondHideEpoch, true, true, true).confirmed && !state.resumeRequired && state.confirmedHideEpoch === secondHideEpoch;
          return checks;
        };
        _createClass(HostResumeLatch, [{
          key: "backgrounded",
          get: function get() {
            return this._backgrounded;
          }
        }, {
          key: "resumeRequired",
          get: function get() {
            return this._resumeRequired;
          }
        }, {
          key: "hideEpoch",
          get: function get() {
            return this._hideEpoch;
          }
        }, {
          key: "confirmedHideEpoch",
          get: function get() {
            return this._confirmedHideEpoch;
          }
        }]);
        return HostResumeLatch;
      }());

      /** Process-wide host visibility ownership survives Boot -> PhysicsLab scene replacement. */
      var HostLifecycleCoordinator = exports('HostLifecycleCoordinator', /*#__PURE__*/function () {
        function HostLifecycleCoordinator() {}
        HostLifecycleCoordinator.install = function install() {
          var _this = this;
          if (this.installed) return;
          this.installed = true;
          game.on(Game.EVENT_HIDE, this.onEngineHide, this);
          game.on(Game.EVENT_SHOW, this.onEngineShow, this);
          if (typeof document !== 'undefined') {
            this.visibilityListener = function (event) {
              return _this.setDomHidden(document.visibilityState === 'hidden', event.isTrusted);
            };
            document.addEventListener('visibilitychange', this.visibilityListener);
            this.setDomHidden(document.visibilityState === 'hidden', null);
          }
          this.record('install', this.backgrounded, null);
        };
        HostLifecycleCoordinator.subscribe = function subscribe(listener) {
          var _this2 = this;
          this.listeners.add(listener);
          listener(this.snapshot());
          return function () {
            _this2.listeners["delete"](listener);
          };
        };
        HostLifecycleCoordinator.snapshot = function snapshot() {
          return {
            domHidden: this.domHidden,
            engineHidden: this.engineHidden,
            backgrounded: this.backgrounded,
            resumeRequired: this.resumeLatch.resumeRequired,
            hideEpoch: this.resumeLatch.hideEpoch,
            confirmedHideEpoch: this.resumeLatch.confirmedHideEpoch,
            revision: this.revision,
            eventCount: this.totalEvents,
            events: this.events.slice()
          };
        }

        /** Called only by a validated user resume action after LabPauseGate has accepted R. */;
        HostLifecycleCoordinator.confirmUserResume = function confirmUserResume(hideEpoch, ready, visible, guardsClear) {
          var result = this.resumeLatch.confirmResume(hideEpoch, ready, visible, guardsClear);
          if (result.confirmed) {
            this.revision++;
            this.record('resume-confirm', false, null);
            var snapshot = this.snapshot();
            for (var _iterator = _createForOfIteratorHelperLoose(this.listeners), _step; !(_step = _iterator()).done;) {
              var listener = _step.value;
              listener(snapshot);
            }
          }
          return result;
        };
        HostLifecycleCoordinator.verifyResumeTransitionsForTests = function verifyResumeTransitionsForTests() {
          return HostResumeLatch.verifyTransitions();
        };
        HostLifecycleCoordinator.disposeForTests = function disposeForTests() {
          if (!this.installed) return;
          game.off(Game.EVENT_HIDE, this.onEngineHide, this);
          game.off(Game.EVENT_SHOW, this.onEngineShow, this);
          if (this.visibilityListener && typeof document !== 'undefined') document.removeEventListener('visibilitychange', this.visibilityListener);
          this.visibilityListener = null;
          this.installed = false;
          this.listeners.clear();
        };
        HostLifecycleCoordinator.setDomHidden = function setDomHidden(hidden, trusted) {
          if (this.domHidden === hidden) {
            this.record('dom', hidden, trusted);
            return;
          }
          var previousBackgrounded = this.backgrounded;
          this.domHidden = hidden;
          this.publish('dom', hidden, trusted, previousBackgrounded);
        };
        HostLifecycleCoordinator.setEngineHidden = function setEngineHidden(hidden) {
          if (this.engineHidden === hidden) {
            this.record('engine', hidden, null);
            return;
          }
          var previousBackgrounded = this.backgrounded;
          this.engineHidden = hidden;
          this.publish('engine', hidden, null, previousBackgrounded);
        };
        HostLifecycleCoordinator.publish = function publish(source, hidden, trusted, previousBackgrounded) {
          if (previousBackgrounded !== this.backgrounded) {
            this.revision++;
            this.resumeLatch.setBackgrounded(this.backgrounded);
          }
          this.record(source, hidden, trusted);
          var snapshot = this.snapshot();
          for (var _iterator2 = _createForOfIteratorHelperLoose(this.listeners), _step2; !(_step2 = _iterator2()).done;) {
            var listener = _step2.value;
            listener(snapshot);
          }
        };
        HostLifecycleCoordinator.record = function record(source, hidden, trusted) {
          this.totalEvents++;
          this.events.push({
            source: source,
            hidden: hidden,
            backgrounded: this.backgrounded,
            trusted: trusted,
            atMs: typeof performance !== 'undefined' ? performance.now() : Date.now(),
            revision: this.revision
          });
          if (this.events.length > 128) this.events.shift();
        };
        _createClass(HostLifecycleCoordinator, null, [{
          key: "backgrounded",
          get: function get() {
            return this.domHidden || this.engineHidden;
          }
        }]);
        return HostLifecycleCoordinator;
      }());
      _class2 = HostLifecycleCoordinator;
      HostLifecycleCoordinator.domHidden = false;
      HostLifecycleCoordinator.engineHidden = false;
      HostLifecycleCoordinator.revision = 0;
      HostLifecycleCoordinator.totalEvents = 0;
      HostLifecycleCoordinator.installed = false;
      HostLifecycleCoordinator.listeners = new Set();
      HostLifecycleCoordinator.resumeLatch = new HostResumeLatch();
      HostLifecycleCoordinator.events = [];
      HostLifecycleCoordinator.visibilityListener = null;
      HostLifecycleCoordinator.onEngineHide = function () {
        return _class2.setEngineHidden(true);
      };
      HostLifecycleCoordinator.onEngineShow = function () {
        return _class2.setEngineHidden(false);
      };
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/LabPauseGate.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
  var _createClass, cclegacy;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
    }, function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      cclegacy._RF.push({}, "824e6T919JE4pplwOeh0syf", "LabPauseGate", undefined);
      /** Owns PhysicsLab pause causes without pausing the Cocos host game loop. */
      var LabPauseGate = exports('LabPauseGate', /*#__PURE__*/function () {
        function LabPauseGate() {
          this.reasons = new Set();
          this._revision = 0;
          this._interruptionSerial = 0;
        }
        var _proto = LabPauseGate.prototype;
        _proto.has = function has(reason) {
          return this.reasons.has(reason);
        };
        _proto.mask = function mask() {
          var mask = 0;
          if (this.reasons.has('MANUAL')) mask |= 1;
          if (this.reasons.has('BACKGROUND')) mask |= 2;
          if (this.reasons.has('BACKLOG')) mask |= 4;
          if (this.reasons.has('GALLERY')) mask |= 8;
          if (this.reasons.has('REBUILD')) mask |= 16;
          if (this.reasons.has('INITIALIZING')) mask |= 32;
          if (this.reasons.has('ERROR')) mask |= 64;
          if (this.reasons.has('RESUME_REQUIRED')) mask |= 128;
          return mask;
        };
        _proto.snapshot = function snapshot() {
          return Array.from(this.reasons).sort();
        };
        _proto.hold = function hold(reason) {
          if (!reason) throw new Error('Pause reason is required');
          if (!this.reasons.has(reason)) {
            this.reasons.add(reason);
            this._revision++;
            if (reason === 'MANUAL' || reason === 'BACKGROUND' || reason === 'BACKLOG' || reason === 'RESUME_REQUIRED') this._interruptionSerial++;
          }
          return this._revision;
        };
        _proto.release = function release(reason) {
          if (this.reasons["delete"](reason)) this._revision++;
          return this._revision;
        };
        _proto.clear = function clear() {
          for (var _len = arguments.length, reasons = new Array(_len), _key = 0; _key < _len; _key++) {
            reasons[_key] = arguments[_key];
          }
          for (var _i = 0, _reasons = reasons; _i < _reasons.length; _i++) {
            var reason = _reasons[_i];
            this.release(reason);
          }
          return this._revision;
        };
        _proto.requestUserResume = function requestUserResume(ready, visible, guardsClear) {
          if (guardsClear === void 0) {
            guardsClear = true;
          }
          if (!ready) return {
            ok: false,
            reason: 'INITIALIZING'
          };
          if (!visible || this.reasons.has('BACKGROUND')) return {
            ok: false,
            reason: 'BACKGROUND'
          };
          for (var _i2 = 0, _arr = ['GALLERY', 'REBUILD', 'ERROR', 'INITIALIZING']; _i2 < _arr.length; _i2++) {
            var reason = _arr[_i2];
            if (this.reasons.has(reason)) return {
              ok: false,
              reason: reason
            };
          }
          if (!guardsClear) return {
            ok: false,
            reason: 'PAUSE_GUARD'
          };
          // RESUME_REQUIRED belongs to the process-wide host latch and is released only after its
          // current hide epoch has been confirmed by the same validated user action.
          this.clear('MANUAL', 'BACKLOG', 'SAMPLE_COMPLETE');
          return {
            ok: true,
            reason: null
          };
        };
        _createClass(LabPauseGate, [{
          key: "canAdvance",
          get: function get() {
            return this.reasons.size === 0;
          }
        }, {
          key: "revision",
          get: function get() {
            return this._revision;
          }
        }, {
          key: "interruptionSerial",
          get: function get() {
            return this._interruptionSerial;
          }
        }]);
        return LabPauseGate;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/LabProbe.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './CupSweepProbe.ts'], function (exports) {
  var _extends, _createClass, cclegacy, sampleCupSegmentSweep, CUP_PROBE_FACE, CUP_PROBE_BOX, CUP_PROBE_ENDPOINT, CUP_PROBE_ESCAPE;
  return {
    setters: [function (module) {
      _extends = module.extends;
      _createClass = module.createClass;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      sampleCupSegmentSweep = module.sampleCupSegmentSweep;
      CUP_PROBE_FACE = module.CUP_PROBE_FACE;
      CUP_PROBE_BOX = module.CUP_PROBE_BOX;
      CUP_PROBE_ENDPOINT = module.CUP_PROBE_ENDPOINT;
      CUP_PROBE_ESCAPE = module.CUP_PROBE_ESCAPE;
    }],
    execute: function () {
      cclegacy._RF.push({}, "6996aJ8LkZFtKs+TYX/sJNx", "LabProbe", undefined);
      /** Bounded, read-only frame and per-physics-step geometry recorder. It never advances or modifies physics. */
      var LabProbe = exports('LabProbe', /*#__PURE__*/function () {
        function LabProbe() {
          var _this = this;
          this.frames = new Float64Array(LabProbe.FRAME_CAPACITY * LabProbe.FRAME_WIDTH);
          this.steps = new Float64Array(LabProbe.STEP_CAPACITY * LabProbe.STEP_WIDTH);
          this.previousX = new Float64Array(65536);
          this.previousY = new Float64Array(65536);
          this.previousValid = new Uint8Array(65536);
          this.currentBodies = new Float64Array(65536 * 6);
          this.sample = new Float64Array(5);
          this.activeSource = null;
          this.minFaceLeft = 0;
          this.minFaceRight = 0;
          this.minFaceBottom = 0;
          this.minBoxLeft = 0;
          this.minBoxRight = 0;
          this.minBoxBottom = 0;
          this.minEndLeft = 0;
          this.minEndRight = 0;
          this.minEndBottom = 0;
          this.escapeMask = 0;
          this.badCount = 0;
          this.bodyVisitor = function (id, radius, x, y, vx, vy, awake) {
            return _this.sampleBody(id, radius, x, y, vx, vy, awake);
          };
          this.frameCount = 0;
          this.frameCursor = 0;
          this.frameOverflow = false;
          this.stepCount = 0;
          this.stepCursor = 0;
          this.stepTotal = 0;
          this.stepGaps = 0;
          this.frameStart = 0;
          this.frameWallGap = 0;
          this.frameTickBefore = 0;
          this.frameStepCount = 0;
          this.frameObserveSteps = 0;
          this.frameAdapterMs = 0;
          this.lastFrameStart = 0;
          this.lastStepTick = 0;
          this.bodySampleCount = 0;
          this.warmupTarget = 0;
          this.observeTarget = 0;
          this.minObserveMs = 0;
          this.warmupSteps = 0;
          this.observeSteps = 0;
          this.observeStartMs = 0;
          this.observeEndMs = 0;
          this.activeObserveMs = 0;
          this.expectedBodyCount = 0;
          this.escapingCount = 0;
          this.nonFiniteCount = 0;
          this.negativeMarginTicks = new Uint32Array(9);
          this.minMargins = new Float64Array(9);
          this.legacySteps = [];
          this.legacyFrames = [];
          this.legacySummaryCache = null;
          this.anomaly = null;
          this._phase = 'SETUP';
          this.mode = 'OFF';
          this.identity = {
            buildId: 'unassigned',
            attemptId: 'unassigned',
            probeVersion: 'lab-probe-v2',
            worldId: 0,
            cupScale: 1
          };
          this.currentEngineDtMs = 0;
          this.resetAggregates();
        }
        var _proto = LabProbe.prototype;
        _proto.configure = function configure(mode, identity) {
          this.mode = mode;
          this.identity = _extends({}, identity);
        };
        _proto.setWorld = function setWorld(worldId, cupScale) {
          this.identity.worldId = worldId;
          this.identity.cupScale = cupScale;
          this.previousValid.fill(0);
          this.lastStepTick = 0;
        };
        _proto.beginContinuousTest = function beginContinuousTest(expectedBodyCount, warmupSteps, observeSteps, minObserveMs) {
          if (warmupSteps === void 0) {
            warmupSteps = 600;
          }
          if (observeSteps === void 0) {
            observeSteps = 3600;
          }
          if (minObserveMs === void 0) {
            minObserveMs = 60000;
          }
          this.resetAttempt();
          this.expectedBodyCount = expectedBodyCount;
          this.warmupTarget = warmupSteps;
          this.observeTarget = observeSteps;
          this.minObserveMs = minObserveMs;
          this._phase = 'WARMUP';
          this.lastFrameStart = 0;
          this.lastStepTick = 0;
        };
        _proto.setPhase = function setPhase(phase) {
          if (!this.anomaly) this._phase = phase;
        };
        _proto.freezeForBacklog = function freezeForBacklog(tick) {
          this.freezeAnomaly('CLOCK_BACKLOG', tick, 0, 0, 0);
        };
        _proto.beginFrame = function beginFrame(engineDtSeconds, tick) {
          this.frameStart = performance.now();
          this.frameWallGap = this.lastFrameStart ? this.frameStart - this.lastFrameStart : 0;
          this.lastFrameStart = this.frameStart;
          this.frameTickBefore = tick;
          this.frameStepCount = 0;
          this.frameObserveSteps = 0;
          this.frameAdapterMs = 0;
          this.currentEngineDtMs = engineDtSeconds * 1000;
        };
        /** Called after the existing adapter.stepFixed() in FixedClock's sole onStep callback. */
        _proto.afterStep = function afterStep(source, tick, adapterMs) {
          this.frameStepCount++;
          this.frameAdapterMs += adapterMs;
          this.stepTotal++;
          if (this.mode === 'OFF' || this.anomaly || !['WARMUP', 'OBSERVE', 'SETUP'].includes(this._phase)) return null;
          var started = performance.now();
          if (this.lastStepTick && tick !== this.lastStepTick + 1) this.stepGaps++;
          this.lastStepTick = tick;
          this.minFaceLeft = this.minFaceRight = this.minFaceBottom = Number.POSITIVE_INFINITY;
          this.minBoxLeft = this.minBoxRight = this.minBoxBottom = Number.POSITIVE_INFINITY;
          this.minEndLeft = this.minEndRight = this.minEndBottom = Number.POSITIVE_INFINITY;
          this.escapeMask = 0;
          this.badCount = 0;
          this.bodySampleCount = 0;
          if (this.mode === 'SUMMARY') {
            this.activeSource = source;
            source.visitBodySamples(this.bodyVisitor);
            this.activeSource = null;
          } else if (this.mode === 'LEGACY_COMPARE') {
            var bodies = [];
            source.visitBodySamples(function (id, radiusDu, xDu, yDu, vxDu, vyDu, sleeping) {
              bodies.push({
                id: id,
                radiusDu: radiusDu,
                xDu: xDu,
                yDu: yDu,
                vxDu: vxDu,
                vyDu: vyDu,
                sleeping: sleeping
              });
            });
            this.bodySampleCount = bodies.length;
            this.legacySteps.push({
              tick: tick,
              phase: this._phase,
              bodies: bodies,
              probeStepMs: 0
            });
          } else this.bodySampleCount = source.entityCount;
          this.nonFiniteCount += this.badCount;
          if (this.escapeMask) this.escapingCount++;
          var stepSlot = this.stepCursor;
          this.pushStep(tick, this.minFaceLeft, this.minFaceRight, this.minFaceBottom, this.minBoxLeft, this.minBoxRight, this.minBoxBottom, this.minEndLeft, this.minEndRight, this.minEndBottom, this.escapeMask, this.badCount, this.bodySampleCount, adapterMs, 0, source.lastStepTimings);
          var failureReason = null;
          if (this._phase === 'OBSERVE') this.frameObserveSteps++;
          if (this.expectedBodyCount > 0 && this.bodySampleCount !== this.expectedBodyCount) {
            failureReason = 'BODY_COUNT_CHANGED';
          } else if (this.badCount || this.escapeMask) {
            failureReason = this.badCount ? 'NON_FINITE_BODY' : 'FINITE_WALL_SWEEP_ESCAPE';
          }
          if (failureReason) this.freezeAnomaly(failureReason, tick, this.escapeMask, this.badCount, 0);else if (this._phase === 'WARMUP') {
            this.warmupSteps++;
            if (this.warmupSteps === this.warmupTarget) {
              this.resetAggregates();
              this._phase = 'OBSERVE';
              this.observeStartMs = performance.now();
            }
          } else if (this._phase === 'OBSERVE') {
            this.observeSteps++;
            this.observeEndMs = performance.now();
            if (this.observeSteps >= this.observeTarget && this.activeObserveMs >= this.minObserveMs) this._phase = 'COMPLETE';
          }
          var probeStepMs = performance.now() - started;
          this.steps[stepSlot * LabProbe.STEP_WIDTH + 14] = probeStepMs;
          var anomaly = this.anomaly;
          if (anomaly) {
            anomaly.probeStepMs = probeStepMs;
            var recentSteps = anomaly.recentSteps;
            if (recentSteps != null && recentSteps.length) recentSteps[recentSteps.length - 1][14] = probeStepMs;
          }
          if (this.mode === 'LEGACY_COMPARE' && this.legacySteps.length) this.legacySteps[this.legacySteps.length - 1].probeStepMs = probeStepMs;
          return failureReason;
        };
        _proto.endFrame = function endFrame(tickAfter, viewMs, labUpdateMs, pauseReasonMask) {
          if (pauseReasonMask === void 0) {
            pauseReasonMask = 0;
          }
          var start = performance.now();
          var slot = this.frameCursor * LabProbe.FRAME_WIDTH;
          this.frames[slot] = this.frameStart;
          this.frames[slot + 1] = this.frameWallGap;
          this.frames[slot + 2] = this.currentEngineDtMs;
          this.frames[slot + 3] = this.frameStepCount;
          this.frames[slot + 4] = this.frameTickBefore;
          this.frames[slot + 5] = tickAfter;
          this.frames[slot + 6] = this.frameAdapterMs;
          this.frames[slot + 7] = viewMs;
          this.frames[slot + 8] = labUpdateMs;
          this.frames[slot + 9] = typeof document !== 'undefined' && document.visibilityState === 'visible' ? 1 : 0;
          this.frames[slot + 10] = typeof document !== 'undefined' && document.hasFocus() ? 1 : 0;
          this.frames[slot + 11] = performance.now() - start;
          this.frames[slot + 12] = this.phaseCode();
          this.frames[slot + 13] = this.identity.worldId;
          this.frames[slot + 14] = pauseReasonMask;
          if (this.mode === 'LEGACY_COMPARE' && ['WARMUP', 'OBSERVE'].includes(this._phase) && this.legacyFrames.length < LabProbe.FRAME_CAPACITY) this.legacyFrames.push({
            wallGapMs: this.frameWallGap,
            engineDtMs: this.currentEngineDtMs,
            steps: this.frameStepCount,
            tickBefore: this.frameTickBefore,
            tickAfter: tickAfter,
            adapterMs: this.frameAdapterMs,
            viewMs: viewMs,
            labUpdateMs: labUpdateMs,
            visible: typeof document !== 'undefined' && document.visibilityState === 'visible',
            hasFocus: typeof document !== 'undefined' && document.hasFocus()
          });
          this.frameCursor = (this.frameCursor + 1) % LabProbe.FRAME_CAPACITY;
          if (this.frameCount < LabProbe.FRAME_CAPACITY) this.frameCount++;else this.frameOverflow = true;
          if (this._phase === 'OBSERVE' && pauseReasonMask === 0 && this.frameObserveSteps > 0 && this.frames[slot + 9] === 1) this.activeObserveMs += Math.max(0, this.frameWallGap);
        };
        _proto["export"] = function _export() {
          var _legacyStepTimes;
          var exportStart = performance.now();
          var legacyStepTimes = this.legacySteps.map(function (record) {
            return record.probeStepMs;
          }).sort(function (a, b) {
            return a - b;
          });
          var legacySummary = this.legacySummaryCache;
          if (this.mode === 'LEGACY_COMPARE' && !legacySummary) legacySummary = {
            stepRecords: this.legacySteps.length,
            warmupRecords: this.legacySteps.filter(function (record) {
              return record.phase === 'WARMUP';
            }).length,
            observeRecords: this.legacySteps.filter(function (record) {
              return record.phase === 'OBSERVE';
            }).length,
            bodyRecords: this.legacySteps.reduce(function (sum, record) {
              return sum + record.bodies.length;
            }, 0),
            frameObjects: this.legacyFrames.length,
            probeStepMs: {
              p50: percentile(legacyStepTimes, 0.5),
              p95: percentile(legacyStepTimes, 0.95),
              p99: percentile(legacyStepTimes, 0.99),
              max: (_legacyStepTimes = legacyStepTimes[legacyStepTimes.length - 1]) != null ? _legacyStepTimes : 0
            },
            measurementScope: 'one object per body per fixed step, per-step body array push, per-step record push, plus per-frame object push; no geometry assertion'
          };
          if (this.mode !== 'LEGACY_COMPARE') legacySummary = null;
          var frames = new Array(this.frameCount);
          var firstFrame = (this.frameCursor - this.frameCount + LabProbe.FRAME_CAPACITY) % LabProbe.FRAME_CAPACITY;
          for (var i = 0; i < this.frameCount; i++) {
            var o = (firstFrame + i) % LabProbe.FRAME_CAPACITY * LabProbe.FRAME_WIDTH;
            frames[i] = {
              wallMs: this.frames[o],
              wallGapMs: this.frames[o + 1],
              engineDtMs: this.frames[o + 2],
              steps: this.frames[o + 3],
              tickBefore: this.frames[o + 4],
              tickAfter: this.frames[o + 5],
              adapterMs: this.frames[o + 6],
              viewMs: this.frames[o + 7],
              labUpdateMs: this.frames[o + 8],
              visible: this.frames[o + 9],
              hasFocus: this.frames[o + 10],
              probeFrameMs: this.frames[o + 11],
              phase: this.frames[o + 12],
              worldId: this.frames[o + 13],
              pauseReasonMask: this.frames[o + 14]
            };
          }
          var steps = new Array(this.stepCount);
          var firstStep = (this.stepCursor - this.stepCount + LabProbe.STEP_CAPACITY) % LabProbe.STEP_CAPACITY;
          for (var _i = 0; _i < this.stepCount; _i++) {
            var _o = (firstStep + _i) % LabProbe.STEP_CAPACITY * LabProbe.STEP_WIDTH;
            var row = new Array(LabProbe.STEP_WIDTH);
            for (var j = 0; j < LabProbe.STEP_WIDTH; j++) row[j] = this.steps[_o + j];
            steps[_i] = row;
          }
          var result = {
            metadata: _extends({}, this.identity, {
              mode: this.mode,
              phase: this._phase
            }),
            coverage: {
              frameCount: this.frameCount,
              frameOverflow: this.frameOverflow,
              totalSteps: this.stepTotal,
              warmupSteps: this.warmupSteps,
              observeSteps: this.observeSteps,
              stepGaps: this.stepGaps,
              observeDurationMs: this.observeEndMs - this.observeStartMs,
              activeObserveMs: this.activeObserveMs,
              expectedBodyCount: this.expectedBodyCount,
              lastBodyCount: this.bodySampleCount
            },
            summary: {
              escapingSteps: this.escapingCount,
              nonFiniteBodies: this.nonFiniteCount,
              minMargins: Array.from(this.minMargins),
              negativeMarginTicks: Array.from(this.negativeMarginTicks)
            },
            anomaly: this.anomaly,
            recentSteps: steps,
            frames: frames,
            legacySummary: legacySummary
          };
          result.measurementScopes = {
            probeStepMs: this.mode === 'LEGACY_COMPARE' ? 'legacy per-body object creation + body array push + per-step record push + fixed-size aggregate/ring writes' : this.mode === 'TIMING' ? 'body-count read + fixed-size per-step aggregate/ring writes' : 'adapter body visitor + finite-wall/endpoint/swept geometry + aggregate/ring write',
            probeFrameMs: this.mode === 'LEGACY_COMPARE' ? 'fixed-size frame ring write + legacy per-frame object push' : 'fixed-size render-frame ring write',
            labUpdateMs: 'whole PhysicsLab.update including HUD refresh and view sync',
            adapterMs: 'whole adapter.stepFixed',
            adapterSubtimings: ['syncToPhysics', 'physicsStep', 'syncFromPhysics', 'velocityClamp'],
            adapterSubtimingsAreNested: true,
            probeExportMs: performance.now() - exportStart
          };
          if (this.mode === 'LEGACY_COMPARE' && ['COMPLETE', 'FAILURE'].includes(this._phase) && !this.legacySummaryCache) {
            this.legacySummaryCache = legacySummary;
            this.legacySteps.length = 0;
            this.legacyFrames.length = 0;
          }
          return result;
        };
        _proto.pushStep = function pushStep(tick, fL, fR, fB, bL, bR, bB, eL, eR, eB, escapeMask, badCount, bodyCount, adapterMs, probeMs, adapterParts) {
          var slot = this.stepCursor * LabProbe.STEP_WIDTH;
          this.steps[slot] = tick;
          this.steps[slot + 1] = fL;
          this.steps[slot + 2] = fR;
          this.steps[slot + 3] = fB;
          this.steps[slot + 4] = bL;
          this.steps[slot + 5] = bR;
          this.steps[slot + 6] = bB;
          this.steps[slot + 7] = eL;
          this.steps[slot + 8] = eR;
          this.steps[slot + 9] = eB;
          this.steps[slot + 10] = escapeMask;
          this.steps[slot + 11] = badCount;
          this.steps[slot + 12] = bodyCount;
          this.steps[slot + 13] = adapterMs;
          this.steps[slot + 14] = probeMs;
          this.steps[slot + 15] = this.phaseCode();
          this.steps[slot + 16] = this.identity.worldId;
          this.steps[slot + 17] = adapterParts.syncToPhysics;
          this.steps[slot + 18] = adapterParts.physicsStep;
          this.steps[slot + 19] = adapterParts.syncFromPhysics;
          this.steps[slot + 20] = adapterParts.velocityClamp;
          this.stepCursor = (this.stepCursor + 1) % LabProbe.STEP_CAPACITY;
          if (this.stepCount < LabProbe.STEP_CAPACITY) this.stepCount++;
        };
        _proto.sampleBody = function sampleBody(id, radius, x, y, vx, vy, awake) {
          var source = this.activeSource;
          this.bodySampleCount++;
          if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(vx) || !Number.isFinite(vy) || !Number.isFinite(radius)) {
            this.badCount++;
            return;
          }
          var base = id * 6;
          var validId = id >= 0 && id < this.previousValid.length;
          var prev = validId && this.previousValid[id] === 1;
          var px = prev ? this.previousX[id] : x;
          var py = prev ? this.previousY[id] : y;
          if (validId) {
            this.previousX[id] = x;
            this.previousY[id] = y;
            this.previousValid[id] = 1;
          }
          if (validId && base + 5 < this.currentBodies.length) {
            this.currentBodies[base] = x;
            this.currentBodies[base + 1] = y;
            this.currentBodies[base + 2] = vx;
            this.currentBodies[base + 3] = vy;
            this.currentBodies[base + 4] = radius;
            this.currentBodies[base + 5] = awake ? 1 : 0;
          } else {
            this.badCount++;
            return;
          }
          if (!source) {
            this.badCount++;
            return;
          }
          for (var segmentIndex = 0; segmentIndex < 3; segmentIndex++) {
            var segment = source.cupSegments[segmentIndex];
            if (!segment) continue;
            sampleCupSegmentSweep(segment, x, y, px, py, radius, prev, this.sample);
            var side = segmentIndex;
            var face = this.sample[CUP_PROBE_FACE];
            var box = this.sample[CUP_PROBE_BOX];
            var end = this.sample[CUP_PROBE_ENDPOINT];
            if (segment.kind === 'left') {
              this.minFaceLeft = Math.min(this.minFaceLeft, face);
              this.minBoxLeft = Math.min(this.minBoxLeft, box);
              this.minEndLeft = Math.min(this.minEndLeft, end);
            } else if (segment.kind === 'right') {
              this.minFaceRight = Math.min(this.minFaceRight, face);
              this.minBoxRight = Math.min(this.minBoxRight, box);
              this.minEndRight = Math.min(this.minEndRight, end);
            } else {
              this.minFaceBottom = Math.min(this.minFaceBottom, face);
              this.minBoxBottom = Math.min(this.minBoxBottom, box);
              this.minEndBottom = Math.min(this.minEndBottom, end);
            }
            this.minMargins[side * 3] = Math.min(this.minMargins[side * 3], face);
            this.minMargins[side * 3 + 1] = Math.min(this.minMargins[side * 3 + 1], box);
            this.minMargins[side * 3 + 2] = Math.min(this.minMargins[side * 3 + 2], end);
            if (Number.isFinite(face) && face < 0) this.negativeMarginTicks[side * 3]++;
            if (Number.isFinite(box) && box < 0) this.negativeMarginTicks[side * 3 + 1]++;
            if (Number.isFinite(end) && end < 0) this.negativeMarginTicks[side * 3 + 2]++;
            if (this.sample[CUP_PROBE_ESCAPE] === 1) this.escapeMask |= 1 << segmentIndex;
          }
        };
        _proto.freezeAnomaly = function freezeAnomaly(reason, tick, escapeMask, badCount, probeStepMs) {
          if (this.anomaly) return;
          this._phase = 'FAILURE';
          var bodies = [];
          for (var _id = 0; _id < this.previousValid.length; _id++) if (this.previousValid[_id]) {
            var o = _id * 6;
            bodies.push([_id, this.currentBodies[o], this.currentBodies[o + 1], this.currentBodies[o + 2], this.currentBodies[o + 3], this.currentBodies[o + 4], this.currentBodies[o + 5]]);
          }
          this.anomaly = {
            reason: reason,
            tick: tick,
            escapeMask: escapeMask,
            badCount: badCount,
            probeStepMs: probeStepMs,
            worldId: this.identity.worldId,
            bodies: bodies,
            triggerFrame: {
              wallGapMs: this.frameWallGap,
              engineDtMs: this.currentEngineDtMs,
              tickBefore: this.frameTickBefore,
              tickAfter: tick,
              stepsInFrame: this.frameStepCount,
              adapterMs: this.frameAdapterMs,
              visibility: typeof document !== 'undefined' ? document.visibilityState : 'unavailable',
              hasFocus: typeof document !== 'undefined' ? document.hasFocus() : false
            },
            recentFrames: this.copyRecentFrames(),
            recentSteps: this.copyRecentSteps()
          };
        };
        _proto.copyRecentFrames = function copyRecentFrames() {
          var out = [];
          var first = (this.frameCursor - this.frameCount + LabProbe.FRAME_CAPACITY) % LabProbe.FRAME_CAPACITY;
          for (var i = 0; i < this.frameCount; i++) {
            var o = (first + i) % LabProbe.FRAME_CAPACITY * LabProbe.FRAME_WIDTH;
            out.push({
              wallMs: this.frames[o],
              wallGapMs: this.frames[o + 1],
              engineDtMs: this.frames[o + 2],
              steps: this.frames[o + 3],
              tickBefore: this.frames[o + 4],
              tickAfter: this.frames[o + 5],
              adapterMs: this.frames[o + 6],
              viewMs: this.frames[o + 7],
              labUpdateMs: this.frames[o + 8],
              visible: this.frames[o + 9],
              hasFocus: this.frames[o + 10],
              probeFrameMs: this.frames[o + 11],
              phase: this.frames[o + 12],
              worldId: this.frames[o + 13],
              pauseReasonMask: this.frames[o + 14]
            });
          }
          return out;
        };
        _proto.copyRecentSteps = function copyRecentSteps() {
          var out = [];
          var first = (this.stepCursor - this.stepCount + LabProbe.STEP_CAPACITY) % LabProbe.STEP_CAPACITY;
          for (var i = 0; i < this.stepCount; i++) {
            var offset = (first + i) % LabProbe.STEP_CAPACITY * LabProbe.STEP_WIDTH;
            var row = [];
            for (var j = 0; j < LabProbe.STEP_WIDTH; j++) row.push(this.steps[offset + j]);
            out.push(row);
          }
          return out;
        };
        _proto.phaseCode = function phaseCode() {
          return this._phase === 'SETUP' ? 0 : this._phase === 'WARMUP' ? 1 : this._phase === 'OBSERVE' ? 2 : this._phase === 'FAILURE' ? 3 : this._phase === 'PAUSED' ? 4 : 5;
        };
        _proto.resetAttempt = function resetAttempt() {
          this.frameCount = 0;
          this.frameCursor = 0;
          this.frameOverflow = false;
          this.stepCount = 0;
          this.stepCursor = 0;
          this.stepTotal = 0;
          this.stepGaps = 0;
          this.warmupSteps = 0;
          this.observeSteps = 0;
          this.observeStartMs = 0;
          this.observeEndMs = 0;
          this.activeObserveMs = 0;
          this.escapingCount = 0;
          this.nonFiniteCount = 0;
          this.anomaly = null;
          this.previousValid.fill(0);
          this.resetAggregates();
          this.legacySteps.length = 0;
          this.legacyFrames.length = 0;
          this.legacySummaryCache = null;
        };
        _proto.resetAggregates = function resetAggregates() {
          this.minMargins.fill(Number.POSITIVE_INFINITY);
          this.negativeMarginTicks.fill(0);
        };
        _createClass(LabProbe, [{
          key: "phase",
          get: function get() {
            return this._phase;
          }
        }, {
          key: "isFrozen",
          get: function get() {
            return this.anomaly !== null;
          }
        }]);
        return LabProbe;
      }());
      LabProbe.FRAME_CAPACITY = 14400;
      LabProbe.FRAME_WIDTH = 15;
      LabProbe.STEP_CAPACITY = 256;
      LabProbe.STEP_WIDTH = 21;
      function percentile(sorted, fraction) {
        if (!sorted.length) return 0;
        return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * fraction))];
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/LocalSaveRepository.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './CloneState.ts', './SaveCodec.ts', './SaveMigration.ts', './SaveValidator.ts'], function (exports) {
  var _extends, _asyncToGenerator, _regeneratorRuntime, cclegacy, cloneState, SaveCodec, SaveMigration, SaveValidator;
  return {
    setters: [function (module) {
      _extends = module.extends;
      _asyncToGenerator = module.asyncToGenerator;
      _regeneratorRuntime = module.regeneratorRuntime;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      cloneState = module.cloneState;
    }, function (module) {
      SaveCodec = module.SaveCodec;
    }, function (module) {
      SaveMigration = module.SaveMigration;
    }, function (module) {
      SaveValidator = module.SaveValidator;
    }],
    execute: function () {
      var _class;
      cclegacy._RF.push({}, "6b825kCf/1EhqsIUbW4AlNx", "LocalSaveRepository", undefined);
      var fail = function fail(code, message, retryable) {
        if (retryable === void 0) {
          retryable = false;
        }
        return {
          ok: false,
          error: {
            code: code,
            message: message,
            retryable: retryable
          }
        };
      };
      var pass = function pass(data) {
        return {
          ok: true,
          data: data
        };
      };
      var defaultBundle = function defaultBundle() {
        return {
          profile: {
            schemaVersion: 3,
            settings: {
              musicGain: .35,
              sfxGain: .7,
              reducedMotion: false,
              dropMode: 'drag_release',
              tutorialCompleted: false
            },
            discoveredLevels: [],
            unlockedStageIds: ['classic'],
            bestScores: {},
            activeRunId: null,
            revision: 0,
            firstNaturalRunCompleted: false,
            rewardedShake: {
              dayKey: null,
              dailyGranted: 0,
              pendingAttempt: null,
              receipts: []
            },
            rewardedRevive: {
              dayKey: null,
              dailyGranted: 0,
              pendingAttempt: null,
              receipts: []
            }
          },
          run: null,
          lastResult: null
        };
      };
      var LocalSaveRepository = exports('LocalSaveRepository', /*#__PURE__*/function () {
        function LocalSaveRepository(debugNamespace, storage) {
          this.memory = new Map();
          this.storage = null;
          this.leaseMode = 'memory-only';
          this.leaseRelease = null;
          this.failOnce = null;
          this.tapStorage = false;
          this.debugNamespace = debugNamespace;
          var tap = globalThis.tap;
          if (!storage && tap && typeof tap.getStorageSync === 'function' && typeof tap.setStorageSync === 'function' && typeof tap.removeStorageSync === 'function') {
            this.tapStorage = true;
            this.storage = {
              getItem: function getItem(key) {
                var value = tap.getStorageSync(key);
                return value == null || value === '' ? null : typeof value === 'string' ? value : JSON.stringify(value);
              },
              setItem: function setItem(key, value) {
                return tap.setStorageSync(key, value);
              },
              removeItem: function removeItem(key) {
                return tap.removeStorageSync(key);
              }
            };
          } else {
            try {
              this.storage = storage != null ? storage : typeof localStorage !== 'undefined' ? localStorage : null;
            } catch (_unused) {
              this.storage = null;
            }
          }
        }
        var _proto = LocalSaveRepository.prototype;
        _proto.injectFaultOnce = function injectFaultOnce(point) {
          this.failOnce = point;
        };
        _proto.acquireWriteLease = /*#__PURE__*/function () {
          var _acquireWriteLease = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2() {
            var _this = this,
              _navigator;
            var lockName, _release, locks, acquired, rejectAcquire, ready, hold;
            return _regeneratorRuntime().wrap(function _callee2$(_context2) {
              while (1) switch (_context2.prev = _context2.next) {
                case 0:
                  if (!this.leaseRelease) {
                    _context2.next = 2;
                    break;
                  }
                  return _context2.abrupt("return", fail('SAVE_LEASE_HELD', '本页面已持有存档写租约'));
                case 2:
                  lockName = this.debugNamespace ? LocalSaveRepository.prefix + ".debug." + this.debugNamespace + ".writer" : LocalSaveRepository.prefix + ".writer"; // Tap minigames have one JS game context, not competing browser tabs.
                  if (!(this.tapStorage && this.storage)) {
                    _context2.next = 11;
                    break;
                  }
                  if (!LocalSaveRepository.tapWriters.has(lockName)) {
                    _context2.next = 6;
                    break;
                  }
                  return _context2.abrupt("return", fail('SAVE_WRITER_EXISTS', '当前小游戏已有存档写入者', true));
                case 6:
                  LocalSaveRepository.tapWriters.add(lockName);
                  this.leaseMode = 'persistent';
                  _release = function _release() {
                    if (_this.leaseRelease !== _release) return;
                    LocalSaveRepository.tapWriters["delete"](lockName);
                    _this.leaseRelease = null;
                    _this.leaseMode = 'memory-only';
                  };
                  this.leaseRelease = _release;
                  return _context2.abrupt("return", pass({
                    mode: 'persistent',
                    release: _release
                  }));
                case 11:
                  locks = (_navigator = globalThis.navigator) == null ? void 0 : _navigator.locks;
                  if (!(!(locks != null && locks.request) || !this.storage)) {
                    _context2.next = 15;
                    break;
                  }
                  this.leaseMode = 'memory-only';
                  return _context2.abrupt("return", pass({
                    mode: 'memory-only',
                    release: function release() {}
                  }));
                case 15:
                  acquired = null;
                  rejectAcquire = null;
                  ready = new Promise(function (resolve, reject) {
                    acquired = resolve;
                    rejectAcquire = reject;
                  });
                  hold = new Promise(function (resolve) {
                    _this.leaseRelease = resolve;
                  });
                  void locks.request(lockName, {
                    mode: 'exclusive',
                    ifAvailable: true
                  }, /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee(lock) {
                    return _regeneratorRuntime().wrap(function _callee$(_context) {
                      while (1) switch (_context.prev = _context.next) {
                        case 0:
                          if (lock) {
                            _context.next = 4;
                            break;
                          }
                          _this.leaseRelease = null;
                          rejectAcquire == null || rejectAcquire(new Error('SAVE_WRITER_EXISTS'));
                          return _context.abrupt("return");
                        case 4:
                          _this.leaseMode = 'persistent';
                          acquired == null || acquired();
                          _context.next = 8;
                          return hold;
                        case 8:
                          _this.leaseRelease = null;
                        case 9:
                        case "end":
                          return _context.stop();
                      }
                    }, _callee);
                  })))["catch"](function (error) {
                    _this.leaseRelease = null;
                    rejectAcquire == null || rejectAcquire(error);
                  });
                  _context2.prev = 20;
                  _context2.next = 23;
                  return ready;
                case 23:
                  return _context2.abrupt("return", pass({
                    mode: 'persistent',
                    release: function release() {
                      return _this.leaseRelease == null ? void 0 : _this.leaseRelease();
                    }
                  }));
                case 26:
                  _context2.prev = 26;
                  _context2.t0 = _context2["catch"](20);
                  return _context2.abrupt("return", fail('SAVE_WRITER_EXISTS', String(_context2.t0), true));
                case 29:
                case "end":
                  return _context2.stop();
              }
            }, _callee2, this, [[20, 26]]);
          }));
          function acquireWriteLease() {
            return _acquireWriteLease.apply(this, arguments);
          }
          return acquireWriteLease;
        }();
        _proto.readBundle = /*#__PURE__*/function () {
          var _readBundle = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee3() {
            var _a$ioError, _a$error;
            var a, b, selected, slot, warning;
            return _regeneratorRuntime().wrap(function _callee3$(_context3) {
              while (1) switch (_context3.prev = _context3.next) {
                case 0:
                  _context3.prev = 0;
                  a = this.readSlot('A');
                  b = this.readSlot('B');
                  _context3.next = 8;
                  break;
                case 5:
                  _context3.prev = 5;
                  _context3.t0 = _context3["catch"](0);
                  return _context3.abrupt("return", fail('STORAGE_IO_ERROR', "\u8BFB\u53D6\u5B58\u6863\u5931\u8D25\uFF1A" + String(_context3.t0), true));
                case 8:
                  if (!(a.unknownVersion || b.unknownVersion)) {
                    _context3.next = 10;
                    break;
                  }
                  return _context3.abrupt("return", fail('SAVE_VERSION_UNSUPPORTED', '发现较新或不支持的存档版本；为保护原档，已禁止回退与写入'));
                case 10:
                  if (!(a.ioError || b.ioError)) {
                    _context3.next = 12;
                    break;
                  }
                  return _context3.abrupt("return", fail('STORAGE_IO_ERROR', "\u8BFB\u53D6\u5B58\u6863\u5931\u8D25\uFF1A" + ((_a$ioError = a.ioError) != null ? _a$ioError : b.ioError), true));
                case 12:
                  if (!(a.error && b.error)) {
                    _context3.next = 14;
                    break;
                  }
                  return _context3.abrupt("return", fail('STORAGE_CORRUPT', "\u53CC\u69FD\u5747\u4E0D\u53EF\u6062\u590D\uFF1AA=" + a.error + "\uFF1BB=" + b.error));
                case 14:
                  if (!(a.envelope && b.envelope && a.envelope.revision === b.envelope.revision && SaveCodec.canonicalJson(a.envelope.payload) !== SaveCodec.canonicalJson(b.envelope.payload))) {
                    _context3.next = 16;
                    break;
                  }
                  return _context3.abrupt("return", fail('SAVE_REVISION_CONFLICT', '相同revision存在不同有效档；原始槽均保留'));
                case 16:
                  selected = !a.envelope ? b.envelope : !b.envelope ? a.envelope : a.envelope.revision >= b.envelope.revision ? a.envelope : b.envelope;
                  slot = selected === a.envelope ? 'A' : selected === b.envelope ? 'B' : null;
                  warning = a.error || b.error ? "\u4E00\u69FD\u635F\u574F\uFF0C\u5DF2\u56DE\u9000\u5230\u53E6\u4E00\u5B8C\u6574\u69FD\uFF1B\u574F\u69FD\u5B57\u8282\u4FDD\u7559\u3002" + ((_a$error = a.error) != null ? _a$error : b.error) : undefined;
                  if (selected) {
                    _context3.next = 21;
                    break;
                  }
                  return _context3.abrupt("return", {
                    ok: true,
                    data: {
                      envelope: null,
                      recoveredFromSlot: null
                    }
                  });
                case 21:
                  return _context3.abrupt("return", {
                    ok: true,
                    data: {
                      envelope: selected,
                      recoveredFromSlot: slot,
                      warning: warning
                    }
                  });
                case 22:
                case "end":
                  return _context3.stop();
              }
            }, _callee3, this, [[0, 5]]);
          }));
          function readBundle() {
            return _readBundle.apply(this, arguments);
          }
          return readBundle;
        }();
        _proto.commitBundle = /*#__PURE__*/function () {
          var _commitBundle = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee4(expectedRevision, expectedRunId, next) {
            var _current$revision, _current$payload$run$, _current$payload$run;
            var read, current, revision, runId, normalized, valid, envelope, active, target, key, prior, existing, backup, text, split, stored, parsed;
            return _regeneratorRuntime().wrap(function _callee4$(_context4) {
              while (1) switch (_context4.prev = _context4.next) {
                case 0:
                  if (!(this.leaseMode !== 'persistent')) {
                    _context4.next = 2;
                    break;
                  }
                  return _context4.abrupt("return", fail('SAVE_MEMORY_ONLY', '当前浏览器缺少可靠跨标签锁，存档仅在内存可用', true));
                case 2:
                  _context4.next = 4;
                  return this.readBundle();
                case 4:
                  read = _context4.sent;
                  if (read.ok) {
                    _context4.next = 7;
                    break;
                  }
                  return _context4.abrupt("return", read);
                case 7:
                  current = read.data.envelope;
                  revision = (_current$revision = current == null ? void 0 : current.revision) != null ? _current$revision : 0;
                  runId = (_current$payload$run$ = current == null || (_current$payload$run = current.payload.run) == null ? void 0 : _current$payload$run.runId) != null ? _current$payload$run$ : null;
                  if (!(revision !== expectedRevision || runId !== expectedRunId)) {
                    _context4.next = 12;
                    break;
                  }
                  return _context4.abrupt("return", fail('CONFLICT_REVISION', '存档已由新操作更新，请先重新读取'));
                case 12:
                  _context4.prev = 12;
                  normalized = _extends({}, cloneState(next), {
                    run: next.run ? SaveCodec.sealSnapshot(next.run) : null
                  });
                  _context4.next = 19;
                  break;
                case 16:
                  _context4.prev = 16;
                  _context4.t0 = _context4["catch"](12);
                  return _context4.abrupt("return", fail('SAVE_NORMALIZE_FAILED', "\u6863\u6848\u89C4\u8303\u5316\u5931\u8D25\uFF1A" + String(_context4.t0)));
                case 19:
                  valid = SaveValidator.bundle(normalized);
                  if (valid.valid) {
                    _context4.next = 22;
                    break;
                  }
                  return _context4.abrupt("return", fail(valid.code, valid.message));
                case 22:
                  envelope = SaveCodec.createEnvelopeV2(revision + 1, normalized);
                  active = read.data.recoveredFromSlot;
                  target = active === 'A' ? 'B' : 'A';
                  key = this.key(target);
                  _context4.prev = 26;
                  prior = this.getItem(key);
                  if (!(prior !== null)) {
                    _context4.next = 35;
                    break;
                  }
                  existing = this.readSlot(target);
                  if (!existing.error) {
                    _context4.next = 35;
                    break;
                  }
                  backup = this.key("backup-" + target);
                  if (this.getItem(backup) === null) this.setItem(backup, prior);
                  if (!(this.getItem(backup) !== prior)) {
                    _context4.next = 35;
                    break;
                  }
                  return _context4.abrupt("return", fail('SAVE_CORRUPT_BACKUP_FAILED', '损坏槽原始字节备份失败，拒绝覆盖'));
                case 35:
                  if (!this.fault('write-before')) {
                    _context4.next = 37;
                    break;
                  }
                  throw new Error('INJECTED_WRITE_BEFORE');
                case 37:
                  text = SaveCodec.canonicalJson(envelope);
                  split = this.fault('partial-slot') ? Math.max(1, Math.floor(text.length / 2)) : text.length;
                  this.setItem(key, text.slice(0, split));
                  if (!(split !== text.length)) {
                    _context4.next = 42;
                    break;
                  }
                  throw new Error('INJECTED_PARTIAL_SLOT');
                case 42:
                  if (!this.fault('slot-complete')) {
                    _context4.next = 44;
                    break;
                  }
                  return _context4.abrupt("return", this.resolveAmbiguousCommit(envelope, target, 'INJECTED_SLOT_COMPLETE'));
                case 44:
                  stored = this.getItem(key);
                  if (stored) {
                    _context4.next = 47;
                    break;
                  }
                  throw new Error('SAVE_READBACK_EMPTY');
                case 47:
                  parsed = JSON.parse(stored);
                  if (!this.fault('readback')) {
                    _context4.next = 50;
                    break;
                  }
                  throw new Error('INJECTED_READBACK');
                case 50:
                  if (!(!SaveValidator.envelope(parsed) || parsed.checksum !== envelope.checksum)) {
                    _context4.next = 52;
                    break;
                  }
                  throw new Error('SAVE_READBACK_INVALID');
                case 52:
                  if (!this.fault('pre-pointer')) {
                    _context4.next = 54;
                    break;
                  }
                  throw new Error('INJECTED_PRE_POINTER');
                case 54:
                  _context4.prev = 54;
                  if (!this.fault('pointer')) {
                    _context4.next = 57;
                    break;
                  }
                  throw new Error('INJECTED_POINTER');
                case 57:
                  this.setItem(this.key('pointer'), target);
                  _context4.next = 63;
                  break;
                case 60:
                  _context4.prev = 60;
                  _context4.t1 = _context4["catch"](54);
                  return _context4.abrupt("return", pass({
                    revision: envelope.revision,
                    committed: true,
                    pointerUpdated: false,
                    warning: "\u6863\u6848\u5DF2\u63D0\u4EA4\uFF0C\u4F46\u6307\u9488\u672A\u66F4\u65B0\uFF1A" + String(_context4.t1)
                  }));
                case 63:
                  return _context4.abrupt("return", pass({
                    revision: envelope.revision,
                    committed: true,
                    pointerUpdated: true
                  }));
                case 66:
                  _context4.prev = 66;
                  _context4.t2 = _context4["catch"](26);
                  return _context4.abrupt("return", this.resolveAmbiguousCommit(envelope, target, String(_context4.t2)));
                case 69:
                case "end":
                  return _context4.stop();
              }
            }, _callee4, this, [[12, 16], [26, 66], [54, 60]]);
          }));
          function commitBundle(_x2, _x3, _x4) {
            return _commitBundle.apply(this, arguments);
          }
          return commitBundle;
        }();
        _proto.exportRaw = function exportRaw() {
          return {
            A: this.getItem(this.key('A')),
            B: this.getItem(this.key('B')),
            pointer: this.getItem(this.key('pointer'))
          };
        };
        _proto.clearDebugNamespace = function clearDebugNamespace() {
          if (!this.debugNamespace) return;
          for (var _i = 0, _Object$keys = Object.keys(this.exportRaw()); _i < _Object$keys.length; _i++) {
            var k = _Object$keys[_i];
            this.removeItem(this.key(k));
          }
        };
        _proto.fault = function fault(point) {
          if (this.failOnce !== point) return false;
          this.failOnce = null;
          return true;
        };
        _proto.key = function key(slot) {
          if (this.debugNamespace) return "milktea.p1b.debug." + this.debugNamespace + "." + slot;
          if (slot === 'backup-A' || slot === 'backup-B') return LocalSaveRepository.prefix + "." + slot;
          return LocalSaveRepository.keys[slot];
        };
        _proto.readSlot = function readSlot(slot) {
          var raw;
          try {
            raw = this.getItem(this.key(slot));
          } catch (error) {
            return {
              envelope: null,
              error: null,
              ioError: String(error)
            };
          }
          if (raw === null) return {
            envelope: null,
            error: null
          };
          try {
            var _parsed$payload, _parsed$payload2, _parsed$payload3;
            if (raw.length > 2000000) return {
              envelope: null,
              error: 'SAVE_TOO_LARGE'
            };
            var parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object' && Number.isInteger(parsed.schemaVersion) && parsed.schemaVersion !== 1 && parsed.schemaVersion !== 2) return {
              envelope: null,
              error: 'SAVE_VERSION_UNSUPPORTED',
              unknownVersion: true
            };
            if (SaveValidator.envelope(parsed)) return {
              envelope: parsed,
              error: null
            };
            if ((parsed == null ? void 0 : parsed.schemaVersion) === 2 && ((_parsed$payload = parsed.payload) == null ? void 0 : _parsed$payload.run) === null && SaveCodec.verifyEnvelopeV2(parsed) && SaveValidator.profileV2(parsed.payload.profile)) {
              var payload = _extends({}, parsed.payload, {
                profile: SaveMigration.profileV2(parsed.payload.profile),
                run: null
              });
              return {
                envelope: SaveCodec.createEnvelopeV2(parsed.revision, payload),
                error: null,
                migrated: true
              };
            }
            if ((parsed == null ? void 0 : parsed.schemaVersion) === 2 && ((_parsed$payload2 = parsed.payload) == null || (_parsed$payload2 = _parsed$payload2.run) == null ? void 0 : _parsed$payload2.saveSchemaVersion) === 4 && SaveCodec.verifyEnvelopeV2(parsed) && SaveValidator.profileV2(parsed.payload.profile) && SaveValidator.legacySnapshotV4(parsed.payload.run).valid) {
              var _payload = _extends({}, parsed.payload, {
                profile: SaveMigration.profileV2(parsed.payload.profile),
                run: SaveMigration.runV4(parsed.payload.run)
              });
              return {
                envelope: SaveCodec.createEnvelopeV2(parsed.revision, _payload),
                error: null,
                migrated: true
              };
            }
            if ((parsed == null ? void 0 : parsed.schemaVersion) === 2 && ((_parsed$payload3 = parsed.payload) == null || (_parsed$payload3 = _parsed$payload3.run) == null ? void 0 : _parsed$payload3.saveSchemaVersion) === 3 && SaveCodec.verifyEnvelopeV2(parsed) && SaveValidator.profileV2(parsed.payload.profile) && SaveValidator.legacySnapshot(parsed.payload.run, 3).valid) {
              var _payload2 = _extends({}, parsed.payload, {
                profile: SaveMigration.profileV2(parsed.payload.profile),
                run: SaveMigration.runV3(parsed.payload.run)
              });
              return {
                envelope: SaveCodec.createEnvelopeV2(parsed.revision, _payload2),
                error: null,
                migrated: true
              };
            }
            if (SaveValidator.legacyEnvelope(parsed)) {
              var migrated = SaveMigration.bundle(parsed.payload);
              var envelope = SaveCodec.createEnvelopeV2(parsed.revision, migrated);
              return {
                envelope: envelope,
                error: null,
                migrated: true
              };
            }
            return {
              envelope: null,
              error: 'SAVE_INVALID'
            };
          } catch (error) {
            return {
              envelope: null,
              error: "SAVE_PARSE:" + String(error)
            };
          }
        };
        _proto.resolveAmbiguousCommit = function resolveAmbiguousCommit(envelope, slot, cause) {
          try {
            var _other$envelope;
            var raw = this.getItem(this.key(slot));
            if (raw !== null) {
              var parsed = JSON.parse(raw);
              if (SaveValidator.envelope(parsed) && parsed.revision === envelope.revision && parsed.checksum === envelope.checksum) return pass({
                revision: envelope.revision,
                committed: true,
                pointerUpdated: false,
                warning: "\u5199\u5165\u540E\u53D1\u751F\u5F02\u5E38\uFF0C\u4F46operation\u5185\u5BB9\u6838\u5BF9\u786E\u8BA4\u5DF2\u63D0\u4EA4\uFF1A" + cause
              });
            }
            var other = this.readSlot(slot === 'A' ? 'B' : 'A');
            if (((_other$envelope = other.envelope) == null ? void 0 : _other$envelope.revision) === envelope.revision && other.envelope.checksum === envelope.checksum) return pass({
              revision: envelope.revision,
              committed: true,
              pointerUpdated: false,
              warning: "\u5F02\u5E38\u540E\u7531\u53CC\u69FD\u6838\u5BF9\u786E\u8BA4\u5DF2\u63D0\u4EA4\uFF1A" + cause
            });
            return fail('SAVE_COMMIT_UNCERTAIN', "\u5199\u5165\u5F02\u5E38\u4E14\u65E0\u6CD5\u786E\u8BA4\u63D0\u4EA4\u72B6\u6001\uFF0C\u7981\u6B62\u76F2\u76EE\u91CD\u8BD5\uFF1A" + cause, false);
          } catch (error) {
            return fail('SAVE_COMMIT_UNCERTAIN', "\u5199\u5165\u5F02\u5E38\u4E14\u8BFB\u53D6\u6838\u5BF9\u5931\u8D25\uFF0C\u7981\u6B62\u76F2\u76EE\u91CD\u8BD5\uFF1A" + String(error), false);
          }
        };
        _proto.getItem = function getItem(key) {
          var _ref2, _this$storage$getItem, _this$storage;
          return (_ref2 = (_this$storage$getItem = (_this$storage = this.storage) == null ? void 0 : _this$storage.getItem(key)) != null ? _this$storage$getItem : this.memory.get(key)) != null ? _ref2 : null;
        };
        _proto.setItem = function setItem(key, value) {
          if (this.storage) this.storage.setItem(key, value);else this.memory.set(key, value);
        };
        _proto.removeItem = function removeItem(key) {
          if (this.storage) this.storage.removeItem(key);else this.memory["delete"](key);
        };
        LocalSaveRepository.emptyBundle = function emptyBundle() {
          return defaultBundle();
        };
        return LocalSaveRepository;
      }());
      _class = LocalSaveRepository;
      LocalSaveRepository.prefix = 'milktea.p1b.local.v1';
      LocalSaveRepository.keys = {
        A: _class.prefix + ".slotA",
        B: _class.prefix + ".slotB",
        pointer: _class.prefix + ".pointer"
      };
      LocalSaveRepository.tapWriters = new Set();
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/main", ['./migrate-canvas.ts', './RewardedAdCoordinator.ts', './RewardedShakeService.ts', './SpillReviveService.ts', './AppRoot.ts', './Viewport.ts', './types.ts', './AppRuntime.ts', './Clock.ts', './CloneState.ts', './ConfigLoader.ts', './DiagnosticRing.ts', './EventIdentity.ts', './HostLifecycleCoordinator.ts', './RewardedAdPolicyLoader.ts', './RunEngine.ts', './RunRng.ts', './Sha256.ts', './SpawnRng.ts', './SpillRevivePolicyLoader.ts', './ArtGallery.ts', './FakeRewardedAdProvider.ts', './LabPauseGate.ts', './LabProbe.ts', './NineSizeQueueLedger.ts', './PhysicsLab.ts', './EffectsController.ts', './LocalSaveRepository.ts', './ReviveLedger.ts', './RewardLedger.ts', './SaveCodec.ts', './SaveMigration.ts', './SaveValidator.ts', './CocosPhysicsAdapter.ts', './CoordinateMapper.ts', './CupGeometry.ts', './CupSweepProbe.ts', './RewardedAdProviderFactory.ts', './TapRewardedAdProvider.ts', './ArtAssets.ts', './ArtCatalog.ts', './GameAudio.ts', './GameRoot.ts'], function () {
  return {
    setters: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
    execute: function () {}
  };
});

System.register("chunks:///_virtual/migrate-canvas.ts", ['cc'], function () {
  var cclegacy, director, Director, Canvas, Camera, game, Node;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
      director = module.director;
      Director = module.Director;
      Canvas = module.Canvas;
      Camera = module.Camera;
      game = module.game;
      Node = module.Node;
    }],
    execute: function () {
      cclegacy._RF.push({}, "622c5UGaqFGkYU+n9gQB/We", "migrate-canvas", undefined);
      var customLayerMask = 0x000fffff;
      var builtinLayerMask = 0xfff00000;
      director.on(Director.EVENT_AFTER_SCENE_LAUNCH, function () {
        var _director$getScene, _director$getScene2, _director$getScene3;
        var roots = (_director$getScene = director.getScene()) == null ? void 0 : _director$getScene.children;
        var allCanvases = (_director$getScene2 = director.getScene()) == null ? void 0 : _director$getScene2.getComponentsInChildren(Canvas);
        if (allCanvases.length <= 1) {
          return;
        }
        allCanvases = allCanvases.filter(function (x) {
          return !!x.cameraComponent;
        });
        var allCameras = (_director$getScene3 = director.getScene()) == null ? void 0 : _director$getScene3.getComponentsInChildren(Camera);
        var usedLayer = 0;
        allCameras.forEach(function (x) {
          return usedLayer |= x.visibility & customLayerMask;
        });
        var persistCanvas = [];
        for (var i = 0, l = roots.length; i < l; i++) {
          var root = roots[i];
          if (!game.isPersistRootNode(root)) {
            continue;
          }
          var canvases = root.getComponentsInChildren(Canvas);
          if (canvases.length === 0) {
            continue;
          }
          persistCanvas.push.apply(persistCanvas, canvases.filter(function (x) {
            return !!x.cameraComponent;
          }));
        }
        persistCanvas.forEach(function (val) {
          var isLayerCollided = allCanvases.find(function (x) {
            return x !== val && x.cameraComponent.visibility & val.cameraComponent.visibility & customLayerMask;
          });
          if (isLayerCollided) {
            var availableLayers = ~usedLayer;
            var lastAvailableLayer = availableLayers & ~(availableLayers - 1);
            val.cameraComponent.visibility = lastAvailableLayer | val.cameraComponent.visibility & builtinLayerMask;
            setChildrenLayer(val.node, lastAvailableLayer);
            usedLayer |= availableLayers;
          }
        });
      });
      function setChildrenLayer(node, layer) {
        for (var i = 0, l = node.children.length; i < l; i++) {
          node.children[i].layer = layer;
          setChildrenLayer(node.children[i], layer);
        }
      }
      var setParentEngine = Node.prototype.setParent;
      {
        Node.prototype.setParent = function (value, keepWorldTransform) {
          setParentEngine.call(this, value, keepWorldTransform);
          if (!value) {
            return;
          }
          // find canvas
          var layer = getCanvasCameraLayer(this);
          if (layer) {
            this.layer = layer;
            setChildrenLayer(this, layer);
          }
        };
      }
      function getCanvasCameraLayer(node) {
        var layer = 0;
        var canvas = node.getComponent(Canvas);
        if (canvas && canvas.cameraComponent) {
          if (canvas.cameraComponent.visibility & canvas.node.layer) {
            layer = canvas.node.layer;
          } else {
            layer = canvas.cameraComponent.visibility & ~(canvas.cameraComponent.visibility - 1);
          }
          return layer;
        }
        if (node.parent) {
          layer = getCanvasCameraLayer(node.parent);
        }
        return layer;
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/NineSizeQueueLedger.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
  var _createClass, cclegacy;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
    }, function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      cclegacy._RF.push({}, "11ed5FFGyNI/5wyA5jum37m", "NineSizeQueueLedger", undefined);
      /** Task-owned candidate history. One fully rejected candidate set is one failure round. */
      var NineSizeQueueLedger = exports('NineSizeQueueLedger', /*#__PURE__*/function () {
        function NineSizeQueueLedger(taskId) {
          this.state = void 0;
          this.failedRoundsByLevel = new Map();
          this.state = {
            taskId: taskId,
            state: 'RUNNING',
            level: 0,
            batchAttempt: 0,
            records: []
          };
        }
        var _proto = NineSizeQueueLedger.prototype;
        _proto.tryCandidates = function tryCandidates(level, candidates, rejectionReason) {
          var _this$failedRoundsByL, _this$failedRoundsByL2, _this$failedRoundsByL3;
          if (!this.canSchedule) return {
            batchAttempt: this.state.batchAttempt,
            acceptedX: null,
            failureRounds: (_this$failedRoundsByL = this.failedRoundsByLevel.get(level)) != null ? _this$failedRoundsByL : 0,
            terminal: true
          };
          if (!Number.isInteger(level) || level < 1 || !candidates.length || candidates.some(function (x) {
            return !Number.isFinite(x);
          })) throw new Error('Invalid nine-size candidate batch');
          var batchAttempt = ++this.state.batchAttempt;
          this.state.level = level;
          var acceptedX = null;
          for (var candidateIndex = 0; candidateIndex < candidates.length; candidateIndex++) {
            var _xDu = candidates[candidateIndex];
            var reason = rejectionReason(_xDu);
            this.state.records.push({
              batchAttempt: batchAttempt,
              candidateIndex: candidateIndex,
              level: level,
              xDu: _xDu,
              accepted: reason === null,
              reason: reason != null ? reason : 'accepted'
            });
            if (reason === null) {
              acceptedX = _xDu;
              break;
            }
          }
          if (acceptedX !== null) return {
            batchAttempt: batchAttempt,
            acceptedX: acceptedX,
            failureRounds: (_this$failedRoundsByL2 = this.failedRoundsByLevel.get(level)) != null ? _this$failedRoundsByL2 : 0,
            terminal: false
          };
          var failureRounds = ((_this$failedRoundsByL3 = this.failedRoundsByLevel.get(level)) != null ? _this$failedRoundsByL3 : 0) + 1;
          this.failedRoundsByLevel.set(level, failureRounds);
          var terminal = failureRounds >= 120;
          if (terminal) this.state.state = 'BLOCKED_FINAL';
          return {
            batchAttempt: batchAttempt,
            acceptedX: null,
            failureRounds: failureRounds,
            terminal: terminal
          };
        };
        _proto.complete = function complete() {
          if (this.canSchedule) this.state.state = 'COMPLETE';
        };
        _proto.cancel = function cancel() {
          if (!this.canSchedule) return false;
          this.state.state = 'CANCELLED';
          return true;
        };
        _createClass(NineSizeQueueLedger, [{
          key: "canSchedule",
          get: function get() {
            return this.state.state === 'RUNNING';
          }
        }]);
        return NineSizeQueueLedger;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/PhysicsLab.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './Clock.ts', './HostLifecycleCoordinator.ts', './AppRoot.ts', './CocosPhysicsAdapter.ts', './CupGeometry.ts', './CupSweepProbe.ts', './ArtAssets.ts', './ArtCatalog.ts', './ArtGallery.ts', './LabPauseGate.ts', './NineSizeQueueLedger.ts', './LabProbe.ts', './Viewport.ts', './AppRuntime.ts'], function (exports) {
  var _inheritsLoose, _extends, _createForOfIteratorHelperLoose, _createClass, _asyncToGenerator, _regeneratorRuntime, cclegacy, _decorator, Canvas, UITransform, input, Input, PhysicsSystem2D, Node, game, Color, Vec2, Label, Vec3, view, BlockInputEvents, Graphics, KeyCode, Component, FixedClock, HostLifecycleCoordinator, CocosPhysicsAdapter, CupGeometry, sampleCupSegmentSweep, ArtAssets, ArtCatalog, ArtGallery, LabPauseGate, NineSizeQueueLedger, LabProbe, configureViewport, AppRuntime;
  return {
    setters: [function (module) {
      _inheritsLoose = module.inheritsLoose;
      _extends = module.extends;
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
      _createClass = module.createClass;
      _asyncToGenerator = module.asyncToGenerator;
      _regeneratorRuntime = module.regeneratorRuntime;
    }, function (module) {
      cclegacy = module.cclegacy;
      _decorator = module._decorator;
      Canvas = module.Canvas;
      UITransform = module.UITransform;
      input = module.input;
      Input = module.Input;
      PhysicsSystem2D = module.PhysicsSystem2D;
      Node = module.Node;
      game = module.game;
      Color = module.Color;
      Vec2 = module.Vec2;
      Label = module.Label;
      Vec3 = module.Vec3;
      view = module.view;
      BlockInputEvents = module.BlockInputEvents;
      Graphics = module.Graphics;
      KeyCode = module.KeyCode;
      Component = module.Component;
    }, function (module) {
      FixedClock = module.FixedClock;
    }, function (module) {
      HostLifecycleCoordinator = module.HostLifecycleCoordinator;
    }, null, function (module) {
      CocosPhysicsAdapter = module.CocosPhysicsAdapter;
    }, function (module) {
      CupGeometry = module.CupGeometry;
    }, function (module) {
      sampleCupSegmentSweep = module.sampleCupSegmentSweep;
    }, function (module) {
      ArtAssets = module.ArtAssets;
    }, function (module) {
      ArtCatalog = module.ArtCatalog;
    }, function (module) {
      ArtGallery = module.ArtGallery;
    }, function (module) {
      LabPauseGate = module.LabPauseGate;
    }, function (module) {
      NineSizeQueueLedger = module.NineSizeQueueLedger;
    }, function (module) {
      LabProbe = module.LabProbe;
    }, function (module) {
      configureViewport = module.configureViewport;
    }, function (module) {
      AppRuntime = module.AppRuntime;
    }],
    execute: function () {
      var _dec, _class;
      cclegacy._RF.push({}, "65637fuh0RRH5AAn6pXFsMn", "PhysicsLab", undefined);
      var ccclass = _decorator.ccclass;
      var PhysicsLab = exports('PhysicsLab', (_dec = ccclass('PhysicsLab'), _dec(_class = /*#__PURE__*/function (_Component) {
        _inheritsLoose(PhysicsLab, _Component);
        function PhysicsLab() {
          var _this;
          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }
          _this = _Component.call.apply(_Component, [this].concat(args)) || this;
          _this.adapter = void 0;
          _this.clock = void 0;
          _this.world = void 0;
          _this.visuals = new Map();
          _this.visualRadii = new Map();
          _this.graphics = void 0;
          _this.diagnostics = void 0;
          _this.touchControls = null;
          _this.nextEntityId = 1;
          _this.renderHz = 60;
          _this.message = '已就绪';
          _this.gravityProbe = null;
          _this.inputBound = false;
          _this.rebuildGeneration = 0;
          _this.worldSerial = 0;
          _this.contactTaskToken = 0;
          _this.contactRebuildTask = null;
          _this.contactRebuildHistory = [];
          _this.contactMatrixTask = null;
          _this.wallMatrixTask = null;
          _this.rebuildCallback = null;
          _this.art = new ArtAssets();
          _this.rearArt = void 0;
          _this.frontArt = void 0;
          _this.cupSprites = [];
          _this.cupWidthScale = 1;
          _this.artGeneration = 0;
          _this.loading = false;
          _this.ready = false;
          _this.showBounds = false;
          _this.gallery = null;
          _this.resumeAfterGallery = false;
          _this.galleryPauseSerial = 0;
          _this.pauseGeneration = 0;
          _this.pauseGate = new LabPauseGate();
          _this.lifecycleUnsubscribe = null;
          _this.queueGeneration = 0;
          _this.queueCallback = null;
          _this.queueLedger = null;
          _this.lastHudText = '';
          _this.hudRefreshMs = 0;
          _this.probe = new LabProbe();
          _this.cadenceProbe = null;
          _this.onWindowKeyDown = function (event) {
            if (!_this.ready && !_this.loading && event.key.toLowerCase() === 't') {
              event.preventDefault();
              void _this.initializeLab();
            }
          };
          return _this;
        }
        var _proto = PhysicsLab.prototype;
        _proto.onLoad = function onLoad() {
          var _browserGlobal$locati,
            _browserGlobal$locati2,
            _search$get,
            _search$get2,
            _this2 = this,
            _this$node$getCompone,
            _AppRuntime$mapper$co,
            _AppRuntime$mapper;
          var browserGlobal = globalThis;
          var search = new URLSearchParams((_browserGlobal$locati = (_browserGlobal$locati2 = browserGlobal.location) == null ? void 0 : _browserGlobal$locati2.search) != null ? _browserGlobal$locati : '');
          var requestedProbe = search.get('p1aProbe');
          var probeMode = requestedProbe === 'summary' ? 'SUMMARY' : requestedProbe === 'light' ? 'TIMING' : requestedProbe === 'legacy' ? 'LEGACY_COMPARE' : 'OFF';
          this.probe.configure(probeMode, {
            buildId: AppRuntime.buildId,
            attemptId: (_search$get = search.get('attemptId')) != null ? _search$get : "runtime-" + Date.now(),
            probeVersion: (_search$get2 = search.get('probeVersion')) != null ? _search$get2 : 'lab-probe-v2',
            worldId: 0,
            cupScale: 1
          });
          browserGlobal.__p1aProbe = {
            phase: function phase() {
              return _this2.probe.phase;
            },
            "export": function _export() {
              return _this2.probe["export"]();
            }
          };
          browserGlobal.__p1aLifecycle = {
            snapshot: function snapshot() {
              return HostLifecycleCoordinator.snapshot();
            },
            verifyResumeTransitions: function verifyResumeTransitions() {
              return HostLifecycleCoordinator.verifyResumeTransitionsForTests();
            }
          };
          browserGlobal.__p1aLab = {
            snapshot: function snapshot() {
              return _this2.debugSnapshot();
            },
            status: function status() {
              return _this2.runtimeStatus();
            },
            cancelQueue: function cancelQueue() {
              return _this2.cancelQueue('test-cancel');
            },
            startQueue: function startQueue() {
              return _this2.spawnNineSizes();
            },
            cancelContactRebuild: function cancelContactRebuild() {
              return _this2.cancelContactRebuildTask();
            },
            startContactRebuild: function startContactRebuild(interruptAt) {
              if (interruptAt === void 0) {
                interruptAt = 0;
              }
              return _this2.startContactRebuildTest(interruptAt);
            },
            startContactMatrix: function startContactMatrix() {
              return _this2.startContactMatrixTest();
            },
            startWallMatrix: function startWallMatrix() {
              return _this2.startWallCollisionMatrix();
            },
            startPressure: function startPressure(layout) {
              if (layout === void 0) {
                layout = 'original';
              }
              return _this2.startPressureTest(layout);
            },
            startLevelDrop: function startLevelDrop(level) {
              return _this2.startLevelDropForTest(level);
            },
            startNarrowestCup: function startNarrowestCup() {
              return _this2.runNarrowestCup();
            }
          };
          this.lifecycleUnsubscribe = HostLifecycleCoordinator.subscribe(function (state) {
            return _this2.onLifecycleState(state);
          });
          if (!this.node.getComponent(Canvas)) this.node.addComponent(Canvas);
          var transform = (_this$node$getCompone = this.node.getComponent(UITransform)) != null ? _this$node$getCompone : this.node.addComponent(UITransform);
          transform.setContentSize(750, 1334);
          if (AppRuntime.rules) configureViewport(this.node, AppRuntime.rules.viewport);
          input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
          window.addEventListener('keydown', this.onWindowKeyDown);
          input.on(Input.EventType.TOUCH_END, this.onRetryTouch, this);
          this.inputBound = true;
          console.info(JSON.stringify({
            test: 'p1a-runtime-identity',
            buildId: AppRuntime.buildId,
            creator: '3.8.8',
            box2d: '1.0.2',
            ptm: (_AppRuntime$mapper$co = (_AppRuntime$mapper = AppRuntime.mapper) == null ? void 0 : _AppRuntime$mapper.cocosPtmRatio) != null ? _AppRuntime$mapper$co : 32,
            autoSimulation: PhysicsSystem2D.instance.autoSimulation,
            probeMode: probeMode,
            probeVersion: this.probe.identity.probeVersion,
            attemptId: this.probe.identity.attemptId
          }));
        };
        _proto.start = function start() {
          this.createOverlay();
          void this.initializeLab();
        };
        _proto.initializeLab = /*#__PURE__*/function () {
          var _initializeLab = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
            var _this3 = this;
            var rules, generation, owner, requests, _i, _arr, layer, _this$clock, _this$adapter, _this$world, _this$rearArt, _this$frontArt;
            return _regeneratorRuntime().wrap(function _callee$(_context) {
              while (1) switch (_context.prev = _context.next) {
                case 0:
                  if (!(this.loading || this.ready)) {
                    _context.next = 2;
                    break;
                  }
                  return _context.abrupt("return");
                case 2:
                  rules = AppRuntime.rules;
                  if (rules) {
                    _context.next = 6;
                    break;
                  }
                  this.message = '配置未加载：请从 Boot 启动';
                  return _context.abrupt("return");
                case 6:
                  if (PhysicsSystem2D.PHYSICS_BOX2D || PhysicsSystem2D.PHYSICS_BOX2D_WASM) {
                    _context.next = 9;
                    break;
                  }
                  this.message = '需在 Creator 项目设置启用 2D Box2D 后端，重载后按 T 重试';
                  return _context.abrupt("return");
                case 9:
                  generation = ++this.artGeneration;
                  this.loading = true;
                  this.message = '加载已交付的P1美术…';
                  this.art.dispose();
                  this.art = new ArtAssets();
                  owner = this.art;
                  _context.prev = 15;
                  _context.next = 18;
                  return owner.initialize();
                case 18:
                  requests = rules.ingredients.map(function (item) {
                    return owner.load(ArtCatalog.ingredientId(item.id), ArtCatalog.ingredientEdgeDu(item.radius_du) * 2);
                  });
                  requests.push(owner.load('bg_shop_base', 1334), owner.load('spr_cup_shadow', 512));
                  for (_i = 0, _arr = ['back', 'tea', 'rim_back', 'front', 'rim_front', 'base', 'label']; _i < _arr.length; _i++) {
                    layer = _arr[_i];
                    requests.push(owner.load("spr_cup_classic_" + layer, 1000));
                  }
                  _context.next = 23;
                  return Promise.all(requests);
                case 23:
                  if (!(!this.isValid || generation !== this.artGeneration || this.art !== owner)) {
                    _context.next = 26;
                    break;
                  }
                  owner.dispose();
                  return _context.abrupt("return");
                case 26:
                  this.createSceneArt();
                  this.world = new Node('PhysicsWorld');
                  this.node.addChild(this.world);
                  this.world.setSiblingIndex(1);
                  this.adapter = new CocosPhysicsAdapter(this.world, rules, AppRuntime.mapper);
                  this.adapter.createCup('classic');
                  this.adapter.setTimingDiagnostics(this.probe.mode !== 'OFF');
                  this.probe.setWorld(++this.worldSerial, this.cupWidthScale);
                  // Boot may have been hidden and shown while configuration was pending. Re-read the
                  // process-owned latch immediately before clock construction; showing never acknowledges it.
                  this.onLifecycleState(HostLifecycleCoordinator.snapshot());
                  this.clock = new FixedClock(rules.physics.fixed_hz, rules.physics.max_catchup_steps, function () {
                    var _this3$clock$tick, _this3$clock;
                    var stepStarted = _this3.probe.mode === 'OFF' ? 0 : performance.now();
                    _this3.adapter.stepFixed();
                    var nextTick = ((_this3$clock$tick = (_this3$clock = _this3.clock) == null ? void 0 : _this3$clock.tick) != null ? _this3$clock$tick : 0) + 1;
                    if (_this3.probe.mode !== 'OFF') {
                      var probeFailure = _this3.probe.afterStep(_this3.adapter, nextTick, performance.now() - stepStarted);
                      if (probeFailure) {
                        var _this3$clock2;
                        _this3.pauseGate.hold('ERROR');
                        (_this3$clock2 = _this3.clock) == null || _this3$clock2.pause();
                        _this3.message = "\u7269\u7406\u8BCA\u65AD\u9996\u6B21\u5F02\u5E38\uFF1A" + probeFailure + "\uFF0C\u73B0\u573A\u5DF2\u51BB\u7ED3";
                        return;
                      }
                    }
                    _this3.advanceContactTests(nextTick);
                    _this3.advanceContactMatrix(nextTick);
                    _this3.advanceWallCollisionMatrix(nextTick);
                    _this3.sampleGravity(nextTick);
                    _this3.sampleCadence(nextTick);
                  });
                  // A hide can arrive while the asynchronous asset requests are in flight.
                  if (AppRuntime.backgrounded) this.pauseGate.hold('BACKGROUND');
                  if (!this.pauseGate.canAdvance) this.clock.pause();
                  this.ready = true;
                  this.drawCup();
                  this.spawnThree();
                  _context.next = 46;
                  break;
                case 43:
                  _context.prev = 43;
                  _context.t0 = _context["catch"](15);
                  if (this.isValid && generation === this.artGeneration) {
                    this.ready = false;
                    (_this$clock = this.clock) == null || _this$clock.pause();
                    (_this$adapter = this.adapter) == null || _this$adapter.dispose();
                    this.disposeViews();
                    (_this$world = this.world) == null || _this$world.destroy();
                    (_this$rearArt = this.rearArt) == null || _this$rearArt.destroy();
                    (_this$frontArt = this.frontArt) == null || _this$frontArt.destroy();
                    this.art.dispose();
                    console.error('美术/场景初始化失败', _context.t0);
                    this.message = '美术加载失败：点击画面或按 T 重试';
                  } else owner.dispose();
                case 46:
                  _context.prev = 46;
                  if (generation === this.artGeneration) this.loading = false;
                  return _context.finish(46);
                case 49:
                case "end":
                  return _context.stop();
              }
            }, _callee, this, [[15, 43, 46, 49]]);
          }));
          function initializeLab() {
            return _initializeLab.apply(this, arguments);
          }
          return initializeLab;
        }();
        _proto.update = function update(dt) {
          var _this$clock$tick, _this$clock2;
          var updateStart = this.probe.mode === 'OFF' ? 0 : performance.now();
          if (this.probe.mode !== 'OFF') this.probe.beginFrame(dt, (_this$clock$tick = (_this$clock2 = this.clock) == null ? void 0 : _this$clock2.tick) != null ? _this$clock$tick : 0);
          var viewMs = 0;
          try {
            if (this.clock && this.pauseGate.canAdvance && !this.clock.paused) {
              if (this.cadenceProbe) {
                this.cadenceProbe.frames++;
                this.cadenceProbe.renderSeconds += dt;
              }
              var result = this.clock.update(dt);
              if (result.pausedForBacklog) {
                this.pauseGate.hold('BACKLOG');
                this.probe.freezeForBacklog(result.tick);
                this.cadenceProbe = null;
                this.message = '物理落后超过配置补步上限，已暂停；本attempt已冻结，请另开attempt重测';
              }
              var viewStarted = this.probe.mode === 'OFF' ? 0 : performance.now();
              this.syncViews();
              if (this.probe.mode !== 'OFF') viewMs = performance.now() - viewStarted;
            }
            this.refreshDiagnostics();
          } finally {
            var _this$clock$tick2, _this$clock3;
            if (this.probe.mode !== 'OFF') this.probe.endFrame((_this$clock$tick2 = (_this$clock3 = this.clock) == null ? void 0 : _this$clock3.tick) != null ? _this$clock$tick2 : 0, viewMs, performance.now() - updateStart, this.pauseReasonMask());
          }
        };
        _proto.onDestroy = function onDestroy() {
          var _this$gallery, _this$lifecycleUnsubs;
          this.cancelQueue('destroy');
          this.cancelContactRebuildTask();
          this.artGeneration++;
          (_this$gallery = this.gallery) == null || _this$gallery.close();
          this.rebuildGeneration++;
          if (this.inputBound) input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
          window.removeEventListener('keydown', this.onWindowKeyDown);
          input.off(Input.EventType.TOUCH_END, this.onRetryTouch, this);
          (_this$lifecycleUnsubs = this.lifecycleUnsubscribe) == null || _this$lifecycleUnsubs.call(this);
          this.lifecycleUnsubscribe = null;
          if (this.adapter) this.adapter.dispose();
          this.art.dispose();
        };
        _proto.pause = function pause(reason) {
          if (reason === void 0) {
            reason = '手动暂停';
          }
          this.pauseGate.hold('MANUAL');
          if (this.clock) {
            this.pauseGeneration++;
            this.clock.pause();
            this.message = "\u5DF2\u6682\u505C\uFF1A" + reason;
          }
        };
        _proto.resume = function resume() {
          var _this$contactRebuildT, _this$clock4;
          var lifecycle = HostLifecycleCoordinator.snapshot();
          var guardsClear = !this.loading && !this.gallery;
          var result = this.pauseGate.requestUserResume(this.ready, !lifecycle.backgrounded, guardsClear);
          if (!result.ok) {
            this.message = "\u5F53\u524D\u4E0D\u80FD\u6062\u590D\uFF1A" + result.reason;
            return;
          }
          var confirmation = HostLifecycleCoordinator.confirmUserResume(lifecycle.hideEpoch, this.ready, !lifecycle.backgrounded, guardsClear);
          if (!confirmation.ok) {
            this.message = "\u5F53\u524D\u4E0D\u80FD\u6062\u590D\uFF1A" + confirmation.reason;
            return;
          }
          if (this.pauseGate.has('RESUME_REQUIRED')) this.pauseGate.release('RESUME_REQUIRED');
          if (((_this$contactRebuildT = this.contactRebuildTask) == null ? void 0 : _this$contactRebuildT.status) === 'RUNNING' && this.contactRebuildTask.phase === 'WAIT_RESUME') {
            var task = this.contactRebuildTask;
            task.round++;
            task.phase = 'WAIT_CONTACT';
            task.deadlineTick = this.clock.tick + 120;
            this.spawnContactPair(task.round);
          }
          if ((_this$clock4 = this.clock) != null && _this$clock4.paused && this.pauseGate.canAdvance && !AppRuntime.backgrounded) {
            this.clock.resume();
            this.message = '已恢复（后台时间未补算）';
          }
        };
        _proto.clearAndRebuild = function clearAndRebuild() {
          var _this4 = this;
          if (!this.adapter) return;
          this.cancelQueue('rebuild');
          this.cancelContactRebuildTask();
          var shouldResume = this.pauseGate.canAdvance && !AppRuntime.backgrounded && !this.gallery;
          var pauseGeneration = this.pauseGeneration;
          var generation = ++this.rebuildGeneration;
          this.pauseGate.hold('REBUILD');
          this.gravityProbe = null;
          this.cadenceProbe = null;
          this.clock.pause();
          this.disposeViews();
          this.adapter.dispose();
          this.world.destroy();
          this.world = new Node('PhysicsWorld');
          this.node.addChild(this.world);
          this.world.setSiblingIndex(1);
          this.adapter = new CocosPhysicsAdapter(this.world, AppRuntime.rules, AppRuntime.mapper);
          this.probe.setWorld(++this.worldSerial, this.cupWidthScale);
          this.adapter.createCup('classic');
          this.clock.reset();
          this.nextEntityId = 1;
          this.applyCupWidthScale(1);
          this.drawCup();
          this.message = '物理世界已重建';
          if (shouldResume) this.scheduleOnce(function () {
            if (!_this4.isValid || generation !== _this4.rebuildGeneration) return;
            _this4.pauseGate.release('REBUILD');
            if (pauseGeneration !== _this4.pauseGeneration) return;
            if (_this4.pauseGate.canAdvance && !AppRuntime.backgrounded && !_this4.gallery) _this4.clock.resume();
          }, 1 / AppRuntime.rules.physics.fixed_hz);else this.scheduleOnce(function () {
            if (_this4.isValid && generation === _this4.rebuildGeneration) _this4.pauseGate.release('REBUILD');
          }, 1 / AppRuntime.rules.physics.fixed_hz);
        };
        _proto.rebuildTwentyTimes = function rebuildTwentyTimes() {
          this.startContactRebuildTest(0);
        };
        _proto.startContactRebuildTest = function startContactRebuildTest(interruptAt) {
          if (interruptAt === void 0) {
            interruptAt = 0;
          }
          if (!this.ready || !this.adapter || !this.clock) throw new Error('PhysicsLab not ready');
          if (interruptAt !== 0 && interruptAt !== 5 && interruptAt !== 10) throw new Error('interruptAt must be 0, 5, or 10');
          if (AppRuntime.backgrounded || this.gallery || !this.pauseGate.canAdvance && !this.pauseGate.has('SAMPLE_COMPLETE')) throw new Error('Contact rebuild requires a visible lab without another pause owner');
          this.pauseGate.release('SAMPLE_COMPLETE');
          this.cancelQueue('contact-rebuild');
          this.cancelContactRebuildTask();
          this.pauseGate.hold('REBUILD');
          this.clock.pause();
          this.gravityProbe = null;
          this.cadenceProbe = null;
          this.replacePhysicsWorld();
          this.clock.reset();
          var task = {
            attemptId: this.probe.identity.attemptId + "-REB20-" + Date.now(),
            token: ++this.contactTaskToken,
            interruptAt: interruptAt,
            round: 1,
            phase: 'WAIT_CONTACT',
            deadlineTick: 120,
            settleFrames: 0,
            oldWorld: null,
            oldAdapter: null,
            records: [],
            status: 'RUNNING',
            failure: null
          };
          this.contactRebuildTask = task;
          this.spawnContactPair(task.round);
          this.drawCup();
          this.pauseGate.release('REBUILD');
          this.clock.resume();
          console.info(JSON.stringify({
            test: 'contact-rebuild-start',
            attemptId: task.attemptId,
            buildId: this.probe.identity.buildId,
            interruptAt: interruptAt,
            targetRounds: 20,
            contactFixture: 'two actual overlapping level-1 Cocos CircleCollider2D bodies; FixedClock drives physics'
          }));
          return task.attemptId;
        };
        _proto.contactPairIds = function contactPairIds(round) {
          var first = 9001 + (round - 1) * 2;
          return [first, first + 1];
        };
        _proto.spawnContactPair = function spawnContactPair(round) {
          var radius = AppRuntime.rules.ingredients[0].radius_du;
          var center = AppRuntime.rules.cup.center_x_du;
          var y = 620;
          var offset = radius - 0.5;
          var _this$contactPairIds = this.contactPairIds(round),
            first = _this$contactPairIds[0],
            second = _this$contactPairIds[1];
          this.adapter.createBody({
            entityId: first,
            level: 1,
            radiusDu: radius,
            positionDu: {
              x: center - offset,
              y: y
            },
            velocityDuPerSecond: {
              x: 0,
              y: 0
            }
          });
          this.adapter.createBody({
            entityId: second,
            level: 1,
            radiusDu: radius,
            positionDu: {
              x: center + offset,
              y: y
            },
            velocityDuPerSecond: {
              x: 0,
              y: 0
            }
          });
        };
        _proto.advanceContactTests = function advanceContactTests(tick) {
          var task = this.contactRebuildTask;
          if (!task || task.status !== 'RUNNING' || task.phase !== 'WAIT_CONTACT') return;
          var contacts = this.adapter.getContacts();
          var entityIds = this.contactPairIds(task.round);
          if (contacts.some(function (contact) {
            return contact.firstId === entityIds[0] && contact.secondId === entityIds[1];
          }) && this.adapter.contactBeginEvents > 0) {
            task.records.push({
              round: task.round,
              entityIds: entityIds,
              worldId: this.worldSerial,
              contactBeginTick: tick,
              canonicalContacts: contacts.map(function (contact) {
                return contact.contactId;
              }).sort(),
              beginCount: this.adapter.contactBeginEvents,
              contactsAfterBegin: this.adapter.contactCount,
              bodiesBefore: this.adapter.entityCount,
              listenersBefore: this.adapter.listenerCount,
              oldDestroyed: false,
              emptyBaseline: false,
              stableFrames: 0,
              nextWorldId: 0,
              bodiesAfter: -1,
              contactsAfter: -1,
              listenersAfter: -1
            });
            task.oldAdapter = this.adapter;
            task.oldWorld = this.world;
            task.phase = 'WAIT_CLEAR';
            task.settleFrames = 0;
            this.pauseGate.hold('REBUILD');
            this.clock.pause();
            this.scheduleRebuildSettle(task.token, 0);
            return;
          }
          if (tick > task.deadlineTick) {
            var _this$adapter$getBody, _this$adapter$getBody2;
            var first = entityIds[0],
              second = entityIds[1];
            task.failureDiagnostics = {
              expectedEntityIds: entityIds,
              contacts: this.adapter.getContacts(),
              firstBody: (_this$adapter$getBody = this.adapter.getBody(first)) != null ? _this$adapter$getBody : null,
              secondBody: (_this$adapter$getBody2 = this.adapter.getBody(second)) != null ? _this$adapter$getBody2 : null,
              entityCount: this.adapter.entityCount,
              listenerCount: this.adapter.listenerCount,
              stepCount: this.adapter.stepCount,
              worldId: this.worldSerial,
              lifecycle: HostLifecycleCoordinator.snapshot()
            };
            this.finishContactRebuildTask('FAIL', 'CONTACT_BEGIN_TIMEOUT');
          }
        };
        _proto.scheduleRebuildSettle = function scheduleRebuildSettle(token, frame) {
          var _this5 = this;
          if (this.rebuildCallback) this.unschedule(this.rebuildCallback);
          var callback = function callback() {
            var _task$oldAdapter2;
            if (_this5.rebuildCallback === callback) _this5.rebuildCallback = null;
            var task = _this5.contactRebuildTask;
            if (!task || task.token !== token || task.status !== 'RUNNING' || !_this5.isValid) return;
            if (frame === 0) {
              var _task$oldAdapter, _task$oldWorld;
              (_task$oldAdapter = task.oldAdapter) == null || _task$oldAdapter.dispose();
              (_task$oldWorld = task.oldWorld) == null || _task$oldWorld.destroy();
              _this5.disposeViews();
              _this5.createEmptyWorldForTest();
              _this5.clock.reset();
            }
            var oldDestroyed = !task.oldWorld || !task.oldWorld.isValid;
            var empty = _this5.adapter.entityCount === 0 && _this5.adapter.contactCount === 0 && _this5.adapter.listenerCount === 3;
            task.settleFrames = oldDestroyed && empty ? task.settleFrames + 1 : 0;
            if (task.settleFrames < 2 && frame < 8) {
              _this5.scheduleRebuildSettle(token, frame + 1);
              return;
            }
            var last = task.records[task.records.length - 1];
            last.oldDestroyed = oldDestroyed;
            last.emptyBaseline = empty;
            last.stableFrames = task.settleFrames;
            last.nextWorldId = _this5.worldSerial;
            last.bodiesAfter = _this5.adapter.entityCount;
            last.contactsAfter = _this5.adapter.contactCount;
            last.listenersAfter = _this5.adapter.listenerCount;
            var stale = (_task$oldAdapter2 = task.oldAdapter) == null ? void 0 : _task$oldAdapter2.replayStaleContactCallbacksForTest();
            if (!oldDestroyed || !empty || !stale || stale.contactCount !== 0 || stale.colliderOwners !== 0) {
              _this5.finishContactRebuildTask('FAIL', "WORLD_CLEANUP_FAILED_round_" + task.round);
              return;
            }
            if (task.interruptAt === task.round) {
              _this5.finishContactRebuildTask('CANCELLED', "INTERRUPTED_AFTER_CONTACT_ROUND_" + task.round);
              return;
            }
            if (task.round >= 20) {
              _this5.finishContactRebuildTask('PASS', null);
              return;
            }
            _this5.pauseGate.release('REBUILD');
            if (!_this5.pauseGate.canAdvance || AppRuntime.backgrounded) {
              task.phase = 'WAIT_RESUME';
              _this5.clock.pause();
              return;
            }
            task.round++;
            task.phase = 'WAIT_CONTACT';
            task.deadlineTick = _this5.clock.tick + 120;
            _this5.spawnContactPair(task.round);
            _this5.clock.resume();
          };
          this.rebuildCallback = callback;
          this.scheduleOnce(callback, 1 / AppRuntime.rules.physics.fixed_hz);
        };
        _proto.finishContactRebuildTask = function finishContactRebuildTask(status, failure) {
          var task = this.contactRebuildTask;
          if (!task || task.status !== 'RUNNING') return;
          task.status = status;
          task.failure = failure;
          if (this.rebuildCallback) {
            this.unschedule(this.rebuildCallback);
            this.rebuildCallback = null;
          }
          this.pauseGate.release('REBUILD');
          this.pauseGate.hold('SAMPLE_COMPLETE');
          this.clock.pause();
          this.message = "\u63A5\u89E6\u91CD\u5EFA" + status + ": " + task.records.length + "/20\u8F6E" + (failure ? " \xB7 " + failure : '');
          console.info(JSON.stringify({
            test: 'contact-rebuild-result',
            attemptId: task.attemptId,
            buildId: this.probe.identity.buildId,
            status: status,
            failure: failure,
            rounds: task.records,
            "final": {
              entityCount: this.adapter.entityCount,
              contactCount: this.adapter.contactCount,
              listenerCount: this.adapter.listenerCount
            }
          }));
          this.contactRebuildHistory.push({
            attemptId: task.attemptId,
            status: status,
            failure: failure,
            records: task.records.map(function (record) {
              return _extends({}, record);
            })
          });
        };
        _proto.cancelContactRebuildTask = function cancelContactRebuildTask() {
          var _this$contactRebuildT2;
          if (this.rebuildCallback) {
            this.unschedule(this.rebuildCallback);
            this.rebuildCallback = null;
          }
          if (((_this$contactRebuildT2 = this.contactRebuildTask) == null ? void 0 : _this$contactRebuildT2.status) === 'RUNNING') {
            this.contactRebuildTask.status = 'CANCELLED';
            this.contactRebuildTask.failure = 'REPLACED';
            console.info(JSON.stringify({
              test: 'contact-rebuild-result',
              attemptId: this.contactRebuildTask.attemptId,
              status: 'CANCELLED',
              failure: 'REPLACED',
              completedRounds: this.contactRebuildTask.records
            }));
            this.contactRebuildHistory.push({
              attemptId: this.contactRebuildTask.attemptId,
              status: 'CANCELLED',
              failure: 'REPLACED',
              records: this.contactRebuildTask.records.map(function (record) {
                return _extends({}, record);
              })
            });
          }
          this.pauseGate.release('REBUILD');
          this.contactTaskToken++;
        };
        _proto.createEmptyWorldForTest = function createEmptyWorldForTest() {
          this.world = new Node('PhysicsWorld');
          this.node.addChild(this.world);
          this.world.setSiblingIndex(1);
          this.adapter = new CocosPhysicsAdapter(this.world, AppRuntime.rules, AppRuntime.mapper);
          this.adapter.setTimingDiagnostics(this.probe.mode !== 'OFF');
          this.adapter.createCup('classic');
          this.probe.setWorld(++this.worldSerial, this.cupWidthScale);
        };
        _proto.replacePhysicsWorld = function replacePhysicsWorld() {
          var _this$world2;
          if (this.adapter) this.adapter.dispose();
          this.disposeViews();
          if ((_this$world2 = this.world) != null && _this$world2.isValid) this.world.destroy();
          this.createEmptyWorldForTest();
          this.applyCupWidthScale(1);
        };
        _proto.startContactMatrixTest = function startContactMatrixTest() {
          if (!this.ready || !this.adapter || !this.clock) throw new Error('PhysicsLab not ready');
          if (AppRuntime.backgrounded || this.gallery || !this.pauseGate.canAdvance && !this.pauseGate.has('SAMPLE_COMPLETE')) throw new Error('Contact matrix requires a visible lab without another pause owner');
          this.pauseGate.release('SAMPLE_COMPLETE');
          this.cancelContactRebuildTask();
          this.cancelQueue('contact-matrix');
          this.pauseGate.hold('REBUILD');
          this.clock.pause();
          this.replacePhysicsWorld();
          this.clock.reset();
          var radius = AppRuntime.rules.ingredients[0].radius_du;
          var center = AppRuntime.rules.cup.center_x_du;
          var attemptId = this.probe.identity.attemptId + "-CONTACT-" + Date.now();
          var task = {
            token: ++this.contactTaskToken,
            phase: 'PAIR_BEGIN',
            deadlineTick: 300,
            pairA: 9101,
            pairB: 9102,
            corner: 9103,
            pairEndStart: 0,
            result: {
              attemptId: attemptId,
              buildId: this.probe.identity.buildId
            },
            oldAdapter: null,
            oldWorld: null
          };
          this.contactMatrixTask = task;
          this.adapter.createBody({
            entityId: task.pairA,
            level: 1,
            radiusDu: radius,
            positionDu: {
              x: center - radius + 0.5,
              y: 620
            },
            velocityDuPerSecond: {
              x: 0,
              y: 0
            }
          });
          this.adapter.createBody({
            entityId: task.pairB,
            level: 1,
            radiusDu: radius,
            positionDu: {
              x: center + radius - 0.5,
              y: 620
            },
            velocityDuPerSecond: {
              x: 0,
              y: 0
            }
          });
          this.pauseGate.release('REBUILD');
          this.clock.resume();
          console.info(JSON.stringify({
            test: 'contact-matrix-start',
            attemptId: attemptId,
            buildId: this.probe.identity.buildId,
            bodyPair: [task.pairA, task.pairB]
          }));
          return attemptId;
        };
        _proto.startWallCollisionMatrix = function startWallCollisionMatrix() {
          var _this6 = this;
          if (!this.ready || !this.adapter || !this.clock || AppRuntime.backgrounded || this.gallery || !this.pauseGate.canAdvance && !this.pauseGate.has('SAMPLE_COMPLETE')) throw new Error('Wall collision matrix requires a visible lab');
          this.pauseGate.release('SAMPLE_COMPLETE');
          this.cancelContactRebuildTask();
          this.cancelQueue('wall-matrix');
          this.pauseGate.hold('REBUILD');
          this.clock.pause();
          this.replacePhysicsWorld();
          this.clock.reset();
          var rules = AppRuntime.rules;
          var maxSpeed = rules.physics.max_linear_speed * rules.viewport.du_per_spec_physics_unit;
          var cases = [];
          var id = 9400;
          for (var _iterator = _createForOfIteratorHelperLoose(rules.ingredients.slice().sort(function (a, b) {
              return a.level - b.level;
            })), _step; !(_step = _iterator()).done;) {
            var item = _step.value;
            var _loop = function _loop() {
              var kind = _step2.value;
              var radius = item.radius_du;
              var position;
              var velocity;
              var expected = kind === 'left' ? [1] : kind === 'right' ? [2] : kind === 'bottom' ? [0] : kind === 'left-corner' ? [0, 1] : [0, 2];
              if (kind === 'left' || kind === 'right') {
                var segment = _this6.adapter.cupSegments.find(function (value) {
                  return value.kind === kind;
                });
                var face = {
                  x: (segment.innerStart.x + segment.innerEnd.x) / 2,
                  y: (segment.innerStart.y + segment.innerEnd.y) / 2
                };
                var inward = {
                  x: -segment.outward.x,
                  y: -segment.outward.y
                };
                position = {
                  x: face.x + inward.x * (radius + 40),
                  y: face.y + inward.y * (radius + 40)
                };
                velocity = {
                  x: segment.outward.x * maxSpeed,
                  y: segment.outward.y * maxSpeed
                };
              } else if (kind === 'bottom') {
                var bottom = _this6.adapter.cupSegments.find(function (value) {
                  return value.kind === 'bottom';
                });
                position = {
                  x: rules.cup.center_x_du,
                  y: bottom.innerStart.y + radius + 40
                };
                velocity = {
                  x: 0,
                  y: -maxSpeed
                };
              } else {
                var side = _this6.adapter.cupSegments.find(function (value) {
                  return value.kind === (kind === 'left-corner' ? 'left' : 'right');
                });
                var _bottom = _this6.adapter.cupSegments.find(function (value) {
                  return value.kind === 'bottom';
                });
                var inwardSide = {
                  x: -side.outward.x,
                  y: -side.outward.y
                };
                var inwardBottom = {
                  x: 0,
                  y: 1
                };
                var corner = kind === 'left-corner' ? _bottom.innerStart : _bottom.innerEnd;
                var denom = inwardSide.x;
                if (Math.abs(denom) < 1e-6) throw new Error("Corner normal is degenerate: " + kind);
                var inside = {
                  x: (radius + 40 - inwardSide.y * (radius + 40)) / denom,
                  y: radius + 40
                };
                position = {
                  x: corner.x + inside.x,
                  y: corner.y + inside.y
                };
                var direction = {
                  x: inwardSide.x + inwardBottom.x,
                  y: inwardSide.y + inwardBottom.y
                };
                var magnitude = Math.hypot(direction.x, direction.y);
                velocity = {
                  x: -direction.x / magnitude * maxSpeed,
                  y: -direction.y / magnitude * maxSpeed
                };
              }
              cases.push({
                id: id++,
                level: item.level,
                kind: kind,
                radius: radius,
                position: position,
                velocity: velocity,
                expected: expected
              });
            };
            for (var _iterator2 = _createForOfIteratorHelperLoose(['left', 'right', 'bottom', 'left-corner', 'right-corner']), _step2; !(_step2 = _iterator2()).done;) {
              _loop();
            }
          }
          var task = {
            cases: cases,
            index: 0,
            phase: 'COLLIDE',
            deadlineTick: 180,
            nextTick: 0,
            contactsSeen: new Set(),
            lastPosition: _extends({}, cases[0].position),
            sample: new Float64Array(5),
            records: [],
            status: 'RUNNING',
            failure: null
          };
          this.wallMatrixTask = task;
          this.spawnWallMatrixBody(task);
          this.pauseGate.release('REBUILD');
          this.clock.resume();
          console.info(JSON.stringify({
            test: 'wall-matrix-start',
            buildId: this.probe.identity.buildId,
            caseCount: cases.length,
            maxConfiguredSpeedDuPerSecond: maxSpeed,
            cases: cases
          }));
          return cases.length;
        };
        _proto.spawnWallMatrixBody = function spawnWallMatrixBody(task) {
          var test = task.cases[task.index];
          task.contactsSeen.clear();
          task.lastPosition = _extends({}, test.position);
          this.adapter.createBody({
            entityId: test.id,
            level: test.level,
            radiusDu: test.radius,
            positionDu: test.position,
            velocityDuPerSecond: test.velocity
          });
        };
        _proto.advanceWallCollisionMatrix = function advanceWallCollisionMatrix(tick) {
          var task = this.wallMatrixTask;
          if (!task || task.status !== 'RUNNING') return;
          if (task.phase === 'NEXT') {
            if (tick < task.nextTick) return;
            if (task.index >= task.cases.length) {
              this.finishWallCollisionMatrix();
              return;
            }
            task.phase = 'COLLIDE';
            task.deadlineTick = tick + 180;
            this.spawnWallMatrixBody(task);
            return;
          }
          var test = task.cases[task.index];
          var body = this.adapter.getBody(test.id);
          if (!body) {
            task.status = 'FAIL';
            task.failure = "BODY_MISSING_" + test.id;
            this.finishWallCollisionMatrix();
            return;
          }
          var sweptEscape = false;
          for (var i = 0; i < this.adapter.cupSegments.length; i++) {
            sampleCupSegmentSweep(this.adapter.cupSegments[i], body.positionDu.x, body.positionDu.y, task.lastPosition.x, task.lastPosition.y, test.radius, true, task.sample);
            if (task.sample[4] === 1) sweptEscape = true;
          }
          task.lastPosition = _extends({}, body.positionDu);
          var bodyContacts = this.adapter.getContacts().filter(function (contact) {
            return contact.firstId === test.id && contact.secondId === null;
          });
          for (var _iterator3 = _createForOfIteratorHelperLoose(bodyContacts), _step3; !(_step3 = _iterator3()).done;) {
            var contact = _step3.value;
            var boundary = Number(contact.contactId.split('cup:')[1]);
            if (Number.isInteger(boundary)) task.contactsSeen.add(boundary);
          }
          var allContacts = test.expected.every(function (boundary) {
            return task.contactsSeen.has(boundary);
          });
          if (sweptEscape || allContacts || tick > task.deadlineTick) {
            var record = {
              level: test.level,
              caseId: test.id,
              path: test.kind,
              radiusDu: test.radius,
              configuredSpeedDuPerSecond: Math.hypot(test.velocity.x, test.velocity.y),
              expectedBoundaries: test.expected,
              observedBoundaries: Array.from(task.contactsSeen).sort(),
              contactsAtEnd: bodyContacts.map(function (contact) {
                return contact.contactId;
              }),
              contactBeginEvents: this.adapter.contactBeginEvents,
              contactEndEvents: this.adapter.contactEndEvents,
              tick: tick,
              positionDu: body.positionDu,
              velocityDuPerSecond: body.velocityDuPerSecond,
              sweptEscape: sweptEscape,
              status: allContacts && !sweptEscape ? 'PASS' : 'FAIL',
              failure: sweptEscape ? 'SWEPT_WALL_ESCAPE' : !allContacts ? 'EXPECTED_CONTACT_TIMEOUT' : null
            };
            task.records.push(record);
            this.adapter.destroyBody(test.id);
            task.index++;
            if (record.status === 'FAIL') {
              task.status = 'FAIL';
              task.failure = test.level + "_" + test.kind + "_" + record.failure;
              this.finishWallCollisionMatrix();
              return;
            }
            task.phase = 'NEXT';
            task.nextTick = tick + 2;
          }
        };
        _proto.finishWallCollisionMatrix = function finishWallCollisionMatrix() {
          var task = this.wallMatrixTask;
          if (!task || task.phase === 'DONE') return;
          if (task.status === 'RUNNING') task.status = task.records.length === task.cases.length ? 'PASS' : 'FAIL';
          task.phase = 'DONE';
          this.pauseGate.hold('SAMPLE_COMPLETE');
          this.clock.pause();
          this.message = "\u5899\u58C1\u78B0\u649E\u77E9\u9635" + task.status + ": " + task.records.length + "/" + task.cases.length + (task.failure ? " \xB7 " + task.failure : '');
          console.info(JSON.stringify({
            test: 'wall-matrix-result',
            buildId: this.probe.identity.buildId,
            status: task.status,
            failure: task.failure,
            records: task.records
          }));
        };
        _proto.advanceContactMatrix = function advanceContactMatrix(tick) {
          var _this7 = this;
          var task = this.contactMatrixTask;
          if (!task || task.phase === 'DONE') return;
          if (tick > task.deadlineTick) {
            task.result.timeoutDiagnostics = {
              phase: task.phase,
              tick: tick,
              contacts: this.adapter.getContacts(),
              entityIds: [task.pairA, task.pairB, task.corner, 9201, 9202],
              bodies: [task.pairA, task.pairB, task.corner, 9201, 9202].map(function (id) {
                var _this7$adapter$getBod;
                return (_this7$adapter$getBod = _this7.adapter.getBody(id)) != null ? _this7$adapter$getBod : null;
              }),
              entityCount: this.adapter.entityCount,
              contactCount: this.adapter.contactCount,
              contactBeginEvents: this.adapter.contactBeginEvents,
              contactEndEvents: this.adapter.contactEndEvents,
              listenerCount: this.adapter.listenerCount,
              stepCount: this.adapter.stepCount
            };
            task.result.status = 'FAIL';
            task.result.failure = "TIMEOUT_" + task.phase;
            this.finishContactMatrix();
            return;
          }
          var contacts = this.adapter.getContacts();
          var radius = AppRuntime.rules.ingredients[0].radius_du;
          var bottom = this.adapter.cupSegments.find(function (s) {
            return s.kind === 'bottom';
          });
          if (task.phase === 'PAIR_BEGIN' && contacts.some(function (c) {
            return c.firstId === task.pairA && c.secondId === task.pairB;
          })) {
            task.result.pairBegin = {
              contactCount: this.adapter.contactCount,
              beginEvents: this.adapter.contactBeginEvents
            };
            task.pairEndStart = this.adapter.contactEndEvents;
            var maxSpeed = AppRuntime.rules.physics.max_linear_speed * AppRuntime.rules.viewport.du_per_spec_physics_unit;
            this.adapter.setBodyVelocityForTest(task.pairB, {
              x: maxSpeed,
              y: 0
            });
            task.phase = 'PAIR_END';
            task.deadlineTick = tick + 120;
            return;
          }
          if (task.phase === 'PAIR_END' && !contacts.some(function (c) {
            return c.firstId === task.pairA && c.secondId === task.pairB;
          }) && this.adapter.contactEndEvents > task.pairEndStart) {
            task.result.pairEnd = {
              endEvents: this.adapter.contactEndEvents - task.pairEndStart,
              contactCount: this.adapter.contactCount
            };
            var left = this.adapter.cupSegments.find(function (s) {
              return s.kind === 'left';
            });
            var _radius = AppRuntime.rules.ingredients[0].radius_du;
            var _bottom2 = this.adapter.cupSegments.find(function (s) {
              return s.kind === 'bottom';
            });
            var slope = (left.innerEnd.x - left.innerStart.x) / (left.innerEnd.y - left.innerStart.y);
            var cornerY = _bottom2.innerStart.y + _radius - 0.2;
            var leftFaceX = left.innerStart.x + slope * (cornerY - left.innerStart.y);
            var cornerX = leftFaceX + (_radius - 0.2) * Math.sqrt(1 + slope * slope);
            this.adapter.createBody({
              entityId: task.corner,
              level: 1,
              radiusDu: _radius,
              positionDu: {
                x: cornerX,
                y: cornerY
              },
              velocityDuPerSecond: {
                x: 0,
                y: 0
              }
            });
            task.phase = 'CORNER_END_WAIT';
            task.deadlineTick = tick + 120;
            return;
          }
          if (task.phase === 'CORNER_END_WAIT') {
            var cornerContacts = contacts.filter(function (c) {
              return c.firstId === task.corner && c.secondId === null;
            }).map(function (c) {
              return c.contactId;
            });
            var bySegment = new Set(cornerContacts.map(function (x) {
              return x.split('cup:')[1];
            }));
            if (bySegment.has('0') && bySegment.has('1')) {
              task.result.cornerContacts = {
                contactIds: cornerContacts,
                distinctCupSegments: Array.from(bySegment),
                contactCount: this.adapter.contactCount
              };
              task.pairEndStart = this.adapter.contactEndEvents;
              var _maxSpeed = AppRuntime.rules.physics.max_linear_speed * AppRuntime.rules.viewport.du_per_spec_physics_unit;
              this.adapter.setBodyVelocityForTest(task.corner, {
                x: _maxSpeed,
                y: 0
              });
              task.phase = 'CORNER_RELEASE_WAIT';
              task.deadlineTick = tick + 120;
              return;
            }
          }
          if (task.phase === 'CORNER_RELEASE_WAIT') {
            var current = this.adapter.getContacts().filter(function (c) {
              return c.firstId === task.corner && c.secondId === null;
            });
            var hasLeft = current.some(function (c) {
              return c.contactId.endsWith('cup:1');
            });
            var hasBottom = current.some(function (c) {
              return c.contactId.endsWith('cup:0');
            });
            if (!hasLeft && hasBottom && this.adapter.contactEndEvents > task.pairEndStart) {
              task.result.cornerEnd = {
                ended: 'left',
                retained: 'bottom',
                contactIds: current.map(function (c) {
                  return c.contactId;
                }),
                endEvents: this.adapter.contactEndEvents - task.pairEndStart
              };
              task.pairEndStart = this.adapter.contactBeginEvents;
              this.adapter.createBody({
                entityId: 9201,
                level: 1,
                radiusDu: AppRuntime.rules.ingredients[0].radius_du,
                positionDu: {
                  x: AppRuntime.rules.cup.center_x_du - radius + 0.5,
                  y: 850
                },
                velocityDuPerSecond: {
                  x: 0,
                  y: 0
                }
              });
              this.adapter.createBody({
                entityId: 9202,
                level: 1,
                radiusDu: AppRuntime.rules.ingredients[0].radius_du,
                positionDu: {
                  x: AppRuntime.rules.cup.center_x_du + radius - 0.5,
                  y: 850
                },
                velocityDuPerSecond: {
                  x: 0,
                  y: 0
                }
              });
              task.phase = 'OTHER_BEGIN';
              task.deadlineTick = tick + 120;
              return;
            }
          }
          if (task.phase === 'OTHER_BEGIN' && contacts.some(function (c) {
            return c.firstId === 9201 && c.secondId === 9202;
          })) {
            task.result.otherPairBeforeDestroy = {
              contactIds: this.adapter.getContacts().map(function (c) {
                return c.contactId;
              }),
              beginEvents: this.adapter.contactBeginEvents
            };
            task.oldAdapter = this.adapter;
            task.oldWorld = this.world;
            this.adapter.destroyBody(task.corner);
            var afterDestroyContacts = this.adapter.getContacts().map(function (c) {
              return c.contactId;
            });
            task.result.destroyCleanup = {
              bodyCount: this.adapter.entityCount,
              contactCount: this.adapter.contactCount,
              listenerCount: this.adapter.listenerCount,
              otherPairSurvives: afterDestroyContacts.includes('9201|9202'),
              contactIds: afterDestroyContacts
            };
            task.phase = 'STALE';
            task.deadlineTick = tick + 1;
            return;
          }
          if (task.phase === 'STALE') {
            var old = task.oldAdapter;
            old.dispose();
            task.oldWorld.destroy();
            // Disposal may legitimately emit end events while clearing still-active contacts.
            // Snapshot only after teardown so this assertion isolates stale callback replay.
            var disposedCounts = {
              begins: old.contactBeginEvents,
              ends: old.contactEndEvents
            };
            var stale = old.replayStaleContactCallbacksForTest();
            this.createEmptyWorldForTest();
            this.adapter.createBody({
              entityId: task.pairA,
              level: 1,
              radiusDu: AppRuntime.rules.ingredients[0].radius_du,
              positionDu: {
                x: AppRuntime.rules.cup.center_x_du - 50,
                y: 600
              },
              velocityDuPerSecond: {
                x: 0,
                y: 0
              }
            });
            var _current = {
              contacts: this.adapter.contactCount,
              owners: this.adapter.listenerCount
            };
            var replayAgain = old.replayStaleContactCallbacksForTest();
            task.result.destroyCleanup = _extends({}, task.result.destroyCleanup, {
              staleCallbackReplay: stale,
              disposedCounts: disposedCounts,
              oldEventCountsUnchanged: stale.beginEvents === disposedCounts.begins && stale.endEvents === disposedCounts.ends,
              replayAfterIdReuse: replayAgain,
              newWorldUnaffected: _current.contacts === this.adapter.contactCount && _current.owners === this.adapter.listenerCount
            });
            var cornerEnd = task.result.cornerEnd;
            var cleanup = task.result.destroyCleanup;
            task.result.status = task.result.pairBegin && task.result.pairEnd && task.result.cornerContacts && (cornerEnd == null ? void 0 : cornerEnd.ended) === 'left' && cornerEnd.retained === 'bottom' && task.result.otherPairBeforeDestroy && cleanup.bodyCount === 4 && cleanup.contactCount === 1 && cleanup.otherPairSurvives === true && cleanup.listenerCount === 7 && cleanup.oldEventCountsUnchanged === true && cleanup.newWorldUnaffected === true && stale.colliderOwners === 0 && replayAgain.colliderOwners === 0 ? 'PASS' : 'FAIL';
            task.phase = 'DONE';
            this.finishContactMatrix();
          }
        };
        _proto.finishContactMatrix = function finishContactMatrix() {
          var task = this.contactMatrixTask;
          if (!task || task.phase === 'DONE' && task.result.emitted) return;
          task.phase = 'DONE';
          task.result.emitted = true;
          this.pauseGate.hold('SAMPLE_COMPLETE');
          this.clock.pause();
          console.info(JSON.stringify(_extends({
            test: 'contact-matrix-result'
          }, task.result)));
        };
        _proto.runSingleFall = function runSingleFall() {
          this.clearAndRebuild();
          this.message = '自由落体：1级圆从 y=1130DU 释放，无接触区';
          var entityId = this.spawn(1, 375, 1130);
          this.adapter.setLinearDampingForTest(entityId, 0);
          this.gravityProbe = {
            entityId: entityId,
            initialY: 1130,
            samples: new Set()
          };
        };
        _proto.spawnThree = function spawnThree() {
          var _this8 = this;
          this.clearAndRebuild();
          [1100, 1170, 1240].forEach(function (y) {
            return _this8.spawn(3, AppRuntime.rules.cup.center_x_du, y);
          });
          this.message = '三圆堆积试验：同级圆从杯口上方无重叠释放';
        };
        _proto.startLevelDropForTest = function startLevelDropForTest(level) {
          if (!Number.isInteger(level) || !AppRuntime.rules.ingredients.some(function (item) {
            return item.level === level;
          })) throw new Error("Unknown level: " + level);
          if (!this.ready || AppRuntime.backgrounded || this.gallery || !this.pauseGate.canAdvance && !this.pauseGate.has('SAMPLE_COMPLETE')) throw new Error('Independent level drop requires a visible lab without another pause owner');
          this.pauseGate.release('SAMPLE_COMPLETE');
          this.clearAndRebuild();
          var id = this.spawn(level, AppRuntime.rules.cup.center_x_du, AppRuntime.rules.cup.spawn_y_du);
          this.message = "\u72EC\u7ACB\u5C3A\u5BF8\u8BD5\u9A8C\uFF1A\u7B2C" + level + "\u7EA7\uFF0C\u5B9E\u9645\u534A\u5F84" + AppRuntime.rules.ingredients.find(function (item) {
            return item.level === level;
          }).radius_du + "DU";
          return id;
        };
        _proto.spawnNineSizes = function spawnNineSizes() {
          var _this9 = this;
          if (!this.ready || AppRuntime.backgrounded || this.gallery || !this.pauseGate.canAdvance && !this.pauseGate.has('SAMPLE_COMPLETE')) throw new Error('Nine-size queue requires a visible lab without another pause owner');
          this.pauseGate.release('SAMPLE_COMPLETE');
          this.clearAndRebuild();
          if (this.pauseGate.canAdvance && this.clock.paused) this.clock.resume();
          var generation = this.rebuildGeneration;
          var queueGeneration = ++this.queueGeneration;
          var taskId = "nine-" + Date.now() + "-" + queueGeneration;
          this.queueLedger = new NineSizeQueueLedger(taskId);
          var items = AppRuntime.rules.ingredients.slice().sort(function (a, b) {
            return a.level - b.level;
          });
          var index = 0;
          var levelFailureRound = 0;
          var pendingSpawn = null;
          var dropNext = function dropNext() {
            var _this9$queueState;
            if (!_this9.isValid || generation !== _this9.rebuildGeneration || queueGeneration !== _this9.queueGeneration || ((_this9$queueState = _this9.queueState) == null ? void 0 : _this9$queueState.state) !== 'RUNNING') return;
            if (pendingSpawn) {
              if (_this9.clock.paused || AppRuntime.backgrounded) {
                _this9.scheduleQueueCallback(function () {
                  return dropNext();
                }, 0.25);
                return;
              }
              _this9.spawn(pendingSpawn.level, pendingSpawn.x, AppRuntime.rules.cup.spawn_y_du);
              pendingSpawn = null;
              index++;
              levelFailureRound = 0;
              _this9.message = "\u4E5D\u79CD\u5C3A\u5BF8\u8BD5\u9A8C\uFF1A\u5DF2\u751F\u6210" + index + "/9\u7EA7";
              _this9.scheduleQueueCallback(function () {
                return dropNext();
              }, 1);
              return;
            }
            if (index >= items.length) {
              _this9.queueLedger.complete();
              _this9.message = '九种尺寸试验：九级对象均已依次生成';
              console.log(JSON.stringify({
                test: 'nine-size-queue',
                taskId: taskId,
                state: _this9.queueState.state,
                batches: _this9.queueState.records
              }));
              return;
            }
            var item = items[index];
            _this9.queueState.level = item.level;
            var minX = AppRuntime.rules.cup.center_x_du - AppRuntime.rules.cup.top_width_du / 2;
            var maxX = AppRuntime.rules.cup.center_x_du + AppRuntime.rules.cup.top_width_du / 2;
            var candidates = [AppRuntime.rules.cup.center_x_du, minX + item.radius_du + 4, maxX - item.radius_du - 4, AppRuntime.rules.cup.center_x_du - 70, AppRuntime.rules.cup.center_x_du + 70];
            var batch = _this9.queueLedger.tryCandidates(item.level, candidates, function (value) {
              return _this9.adapter.spawnRejectionReason(item.level, value);
            });
            var x = batch.acceptedX;
            if (x === null) {
              levelFailureRound = batch.failureRounds;
              if (batch.terminal) {
                var result = {
                  test: 'nine-size-queue',
                  taskId: taskId,
                  state: _this9.queueState.state,
                  level: item.level,
                  levelFailureRounds: levelFailureRound,
                  totalBatches: _this9.queueState.batchAttempt,
                  candidatesPerRound: candidates.length,
                  records: _this9.queueState.records
                };
                _this9.message = "\u4E5D\u79CD\u5C3A\u5BF8\u4EFB\u52A1\u7EC8\u6B62\uFF1A\u7B2C" + item.level + "\u7EA7120\u8F6E\u5019\u9009\u5747\u62D2\u7EDD";
                console.log(JSON.stringify(result));
              } else {
                _this9.message = "\u4E5D\u79CD\u5C3A\u5BF8\u8BD5\u9A8C\uFF1A\u7B49\u5F85\u6295\u653E\u7A7A\u95F4\uFF08\u7B2C" + item.level + "\u7EA7\uFF0C\u5931\u8D25\u8F6E" + levelFailureRound + "/120\uFF09";
                _this9.scheduleQueueCallback(function () {
                  return dropNext();
                }, 0.25);
              }
              return;
            }
            if (_this9.clock.paused || AppRuntime.backgrounded) {
              pendingSpawn = {
                level: item.level,
                x: x
              };
              _this9.scheduleQueueCallback(function () {
                return dropNext();
              }, 0.25);
              return;
            }
            _this9.spawn(item.level, x, AppRuntime.rules.cup.spawn_y_du);
            index++;
            levelFailureRound = 0;
            _this9.message = "\u4E5D\u79CD\u5C3A\u5BF8\u8BD5\u9A8C\uFF1A\u5DF2\u751F\u6210" + index + "/9\u7EA7";
            _this9.scheduleQueueCallback(function () {
              return dropNext();
            }, 1);
          };
          dropNext();
        };
        _proto.pressureTest = function pressureTest() {
          this.startPressureTest('original');
        };
        _proto.startPressureTest = function startPressureTest(layout) {
          if (layout === void 0) {
            layout = 'original';
          }
          if (!this.ready || AppRuntime.backgrounded || this.gallery || !this.pauseGate.canAdvance && !this.pauseGate.has('SAMPLE_COMPLETE')) throw new Error('Pressure test requires a visible lab without another pause owner');
          this.pauseGate.release('SAMPLE_COMPLETE');
          this.clearAndRebuild();
          if (this.pauseGate.canAdvance && this.clock.paused) this.clock.resume();
          var rules = AppRuntime.rules;
          var radius = rules.ingredients[0].radius_du;
          var count = 0;
          if (layout === 'mixed') {
            // Fixed 24-body level-1..4 stack kept inside the current cup geometry.
            for (var row = 0; row < 6; row++) for (var col = 0; col < 4; col++) {
              this.spawn((row + col) % 4 + 1, 240 + 90 * col, 420 + 80 * row);
              count++;
            }
          } else {
            var spacing = radius * 2 + 1;
            var slope = (rules.cup.top_width_du - rules.cup.bottom_width_du) / (2 * (rules.cup.inner_top_y_du - rules.cup.inner_bottom_y_du));
            var strictOffset = layout === 'strict' ? radius * (Math.sqrt(1 + slope * slope) - 1) : 0;
            for (var _row = 0; _row < 20; _row++) {
              var y = rules.cup.inner_bottom_y_du + radius + _row * spacing;
              var t = (y - rules.cup.inner_bottom_y_du) / (rules.cup.inner_top_y_du - rules.cup.inner_bottom_y_du);
              var width = rules.cup.bottom_width_du + (rules.cup.top_width_du - rules.cup.bottom_width_du) * t;
              var stagger = _row % 2 ? spacing / 2 : 0;
              var columns = Math.floor((width - radius * 2 - stagger) / spacing) + 1;
              var firstX = rules.cup.center_x_du - width / 2 + radius + stagger + strictOffset;
              for (var _col = 0; _col < columns && count < 220; _col++) {
                var x = firstX + _col * spacing;
                if (strictOffset > 0) x += x < rules.cup.center_x_du ? strictOffset : x > rules.cup.center_x_du ? -strictOffset : 0;
                this.spawn(1, x, y);
                count++;
              }
              if (count >= 220) break;
            }
          }
          var preflight = this.runLayoutPreflight(layout + "-" + count);
          globalThis.__p1aLabPreflight = preflight;
          console.info(JSON.stringify(_extends({
            test: 'pressure-layout-preflight',
            buildId: this.probe.identity.buildId,
            attemptId: this.probe.identity.attemptId,
            layout: layout
          }, preflight)));
          if (layout !== 'mixed' && count !== 220) {
            this.message = "\u538B\u529B\u5E03\u5C40\u751F\u6210\u5931\u8D25\uFF1A\u9884\u671F220\u4F53\uFF0C\u5B9E\u9645" + count;
            return;
          }
          if (layout === 'mixed' && count !== 24) {
            this.message = "\u6DF7\u5408\u5E03\u5C40\u751F\u6210\u5931\u8D25\uFF1A\u9884\u671F24\u4F53\uFF0C\u5B9E\u9645" + count;
            return;
          }
          this.probe.beginContinuousTest(count, 600, 3600, 60000);
          this.message = layout === 'mixed' ? "\u6DF7\u5408\u538B\u529B\u5806\uFF1A" + count + "\u4E2A1\uFF5E4\u7EA7\u5706\uFF0C\u56FA\u5B9A\u5386\u53F2\u5750\u6807\u5E03\u5C40" : "\u538B\u529B\u5806\u79EF\uFF1A" + count + "\u4E2A\u4E00\u7EA7\u5706\uFF0C\u5E03\u5C40=" + layout;
        };
        _proto.runLayoutPreflight = function runLayoutPreflight(layoutId) {
          var bodies = [];
          this.adapter.visitBodySamples(function (id, r, x, y) {
            return bodies.push({
              id: id,
              r: r,
              x: x,
              y: y
            });
          });
          bodies.sort(function (a, b) {
            return a.id - b.id;
          });
          var sample = new Float64Array(5);
          var minima = {
            leftFace: Infinity,
            rightFace: Infinity,
            bottomFace: Infinity,
            leftBox: Infinity,
            rightBox: Infinity,
            bottomBox: Infinity,
            leftEndpoint: Infinity,
            rightEndpoint: Infinity,
            bottomEndpoint: Infinity
          };
          var witnesses = {};
          var nonFinite = 0;
          var pairsOverlapping = 0;
          var minPairGap = Infinity;
          var segments = this.adapter.cupSegments;
          for (var i = 0; i < bodies.length; i++) {
            var body = bodies[i];
            if (![body.id, body.r, body.x, body.y].every(Number.isFinite)) {
              nonFinite++;
              continue;
            }
            for (var s = 0; s < segments.length; s++) {
              var segment = segments[s];
              sampleCupSegmentSweep(segment, body.x, body.y, body.x, body.y, body.r, false, sample);
              var prefix = segment.kind === 'left' ? 'left' : segment.kind === 'right' ? 'right' : 'bottom';
              var faceKey = prefix + "Face";
              var boxKey = prefix + "Box";
              var endpointKey = prefix + "Endpoint";
              if (sample[0] < minima[faceKey]) {
                minima[faceKey] = sample[0];
                witnesses[faceKey] = {
                  id: body.id,
                  x: body.x,
                  y: body.y,
                  segment: segment.kind,
                  marginDu: sample[0]
                };
              }
              if (sample[1] < minima[boxKey]) {
                minima[boxKey] = sample[1];
                witnesses[boxKey] = {
                  id: body.id,
                  x: body.x,
                  y: body.y,
                  segment: segment.kind,
                  marginDu: sample[1]
                };
              }
              if (sample[2] < minima[endpointKey]) {
                minima[endpointKey] = sample[2];
                witnesses[endpointKey] = {
                  id: body.id,
                  x: body.x,
                  y: body.y,
                  segment: segment.kind,
                  marginDu: sample[2]
                };
              }
            }
            for (var j = 0; j < i; j++) {
              var other = bodies[j];
              var gap = Math.hypot(body.x - other.x, body.y - other.y) - body.r - other.r;
              minPairGap = Math.min(minPairGap, gap);
              if (gap < 0) pairsOverlapping++;
            }
          }
          var hash = 2166136261;
          for (var _i2 = 0, _bodies = bodies; _i2 < _bodies.length; _i2++) {
            var b = _bodies[_i2];
            for (var _iterator4 = _createForOfIteratorHelperLoose(b.id + "," + b.r.toFixed(6) + "," + b.x.toFixed(6) + "," + b.y.toFixed(6) + ";"), _step4; !(_step4 = _iterator4()).done;) {
              var _char = _step4.value;
              hash ^= _char.charCodeAt(0);
              hash = Math.imul(hash, 16777619);
            }
          }
          return {
            layoutId: layoutId,
            entityCount: bodies.length,
            layoutHashFNV1a: (hash >>> 0).toString(16).padStart(8, '0'),
            minimumMarginsDu: minima,
            minimumMarginWitnesses: witnesses,
            negativeMarginInterpretation: {
              face: 'negative means the circle center is closer to the finite inner face than its radius; indicates initial penetration of that face',
              wallBox: 'negative means circle intersects the finite wall box, including its half-thickness',
              endpoint: 'negative means circle intersects a finite collider endpoint cap',
              pairGap: 'negative means two initial circle centers overlap by the absolute gap'
            },
            nonFinite: nonFinite,
            overlappingPairs: pairsOverlapping,
            minimumPairGapDu: minPairGap,
            coordinates: bodies.map(function (b) {
              return [b.id, b.r, b.x, b.y];
            })
          };
        };
        _proto.compareRenderRate = function compareRenderRate(hz) {
          this.renderHz = hz;
          game.setFrameRate(hz);
          this.message = "\u6E32\u67D3\u5E27\u7387\u8BBE\u4E3A" + hz + "fps\uFF1B\u7269\u7406\u4ECD\u4E3A" + AppRuntime.rules.physics.fixed_hz + "Hz";
        };
        _proto.runFixedStepSample = function runFixedStepSample() {
          var _this10 = this;
          if (!this.ready || AppRuntime.backgrounded || this.gallery || this.pauseGate.has('RESUME_REQUIRED') || this.pauseGate.has('REBUILD') || this.pauseGate.has('ERROR')) {
            this.message = '当前不能启动固定步采样';
            return;
          }
          // V is a sample control, not a substitute for explicit host resume acknowledgement.
          this.pauseGate.clear('MANUAL', 'BACKLOG', 'SAMPLE_COMPLETE');
          this.runSingleFall();
          this.clock.pause();
          var generation = this.rebuildGeneration;
          var pauseGeneration = this.pauseGeneration;
          this.cadenceProbe = {
            entityId: this.gravityProbe.entityId,
            renderHz: this.renderHz,
            frames: 0,
            renderSeconds: 0
          };
          this.message = this.renderHz + "fps \u5BF9\u7167\uFF1A\u8FD0\u884C120\u4E2A\u7269\u7406tick\u540E\u81EA\u52A8\u6682\u505C\uFF0C\u7ED3\u679C\u5199\u5165\u63A7\u5236\u53F0";
          this.scheduleOnce(function () {
            if (_this10.isValid && generation === _this10.rebuildGeneration && pauseGeneration === _this10.pauseGeneration && !AppRuntime.backgrounded && !_this10.gallery && _this10.pauseGate.canAdvance) _this10.clock.resume();
          }, 1 / AppRuntime.rules.physics.fixed_hz);
        };
        _proto.runNarrowestCup = function runNarrowestCup() {
          if (!this.ready || AppRuntime.backgrounded || this.gallery || !this.pauseGate.canAdvance && !this.pauseGate.has('SAMPLE_COMPLETE')) throw new Error('Narrow-cup test requires a visible lab without another pause owner');
          this.pauseGate.release('SAMPLE_COMPLETE');
          this.clearAndRebuild();
          var rules = AppRuntime.rules;
          var narrowest = rules.stages.reduce(function (best, stage) {
            return stage.cup_width_scale < best.cup_width_scale ? stage : best;
          });
          var largest = rules.ingredients.reduce(function (best, item) {
            return item.radius_du > best.radius_du ? item : best;
          });
          this.adapter.createCup(narrowest.id);
          this.applyCupWidthScale(narrowest.cup_width_scale);
          this.spawn(largest.level, rules.cup.center_x_du, rules.cup.spawn_y_du);
          this.drawCup();
          this.message = "\u6700\u7A84\u676F\u7269\u7406\u8BD5\u9A8C\uFF1A\u5BBD\u5EA6\u500D\u7387" + narrowest.cup_width_scale + "\uFF0C\u6700\u9AD8\u7EA7\u534A\u5F84" + largest.radius_du + "DU";
        };
        _proto.sampleCadence = function sampleCadence(tick) {
          if (!this.cadenceProbe || tick !== 120) return;
          console.log(JSON.stringify({
            test: 'fixed-step-120',
            requestedRenderHz: this.cadenceProbe.renderHz,
            measuredRenderHz: this.cadenceProbe.frames / this.cadenceProbe.renderSeconds,
            renderFrames: this.cadenceProbe.frames,
            renderSeconds: this.cadenceProbe.renderSeconds,
            tick: tick,
            physicsStepCalls: this.adapter.stepCount,
            state: this.adapter.getBody(this.cadenceProbe.entityId),
            configVersion: AppRuntime.rules.design_rules_version,
            ptmRatio: AppRuntime.mapper.cocosPtmRatio
          }));
          this.cadenceProbe = null;
          this.pauseGate.hold('SAMPLE_COMPLETE');
          this.clock.pause();
          this.message = '120个物理tick采样完成，已暂停；控制台有实际刚体状态';
        };
        _proto.spawn = function spawn(level, xDu, yDu) {
          var item = AppRuntime.rules.ingredients.find(function (value) {
            return value.level === level;
          });
          if (!item) throw new Error("Unknown level " + level);
          var id = this.nextEntityId++;
          this.adapter.createBody({
            entityId: id,
            level: item.level,
            radiusDu: item.radius_du,
            positionDu: {
              x: xDu,
              y: yDu
            },
            velocityDuPerSecond: {
              x: 0,
              y: 0
            }
          });
          var edge = ArtCatalog.ingredientEdgeDu(item.radius_du);
          var visual = this.art.createSprite(this.world, ArtCatalog.ingredientId(item.id), edge, edge);
          visual.name = "IngredientVisual-" + id;
          visual.setPosition(xDu - AppRuntime.rules.viewport.width_du / 2, yDu - AppRuntime.rules.viewport.height_du / 2, 0);
          this.visuals.set(id, visual);
          this.visualRadii.set(id, item.radius_du);
          return id;
        };
        _proto.scheduleQueueCallback = function scheduleQueueCallback(callback, delaySeconds) {
          var _this11 = this;
          if (this.queueCallback) this.unschedule(this.queueCallback);
          var owned = function owned() {
            if (_this11.queueCallback === owned) _this11.queueCallback = null;
            callback();
          };
          this.queueCallback = owned;
          this.scheduleOnce(owned, delaySeconds);
        };
        _proto.cancelQueue = function cancelQueue(reason) {
          var _this$queueLedger;
          var current = this.queueState;
          if (this.queueCallback) {
            this.unschedule(this.queueCallback);
            this.queueCallback = null;
          }
          if ((current == null ? void 0 : current.state) !== 'RUNNING') return;
          (_this$queueLedger = this.queueLedger) == null || _this$queueLedger.cancel();
          this.queueGeneration++;
          console.log(JSON.stringify({
            test: 'nine-size-queue',
            taskId: current.taskId,
            state: 'CANCELLED',
            reason: reason,
            level: current.level,
            batchAttempt: current.batchAttempt,
            records: current.records
          }));
        };
        _proto.sampleGravity = function sampleGravity(tick) {
          var probe = this.gravityProbe;
          if (!probe || tick !== 30 && tick !== 60 || probe.samples.has(tick)) return;
          var state = this.adapter.getBody(probe.entityId);
          if (!state) return;
          probe.samples.add(tick);
          var seconds = tick / AppRuntime.rules.physics.fixed_hz;
          console.log(JSON.stringify({
            test: 'gravity-free-fall',
            tick: tick,
            seconds: seconds,
            initialYDu: probe.initialY,
            actualYDu: state.positionDu.y,
            actualDisplacementDu: probe.initialY - state.positionDu.y,
            actualVelocityDuPerSecond: state.velocityDuPerSecond.y,
            theoreticalDisplacementDu: 0.5 * Math.abs(AppRuntime.rules.physics.gravity.y) * AppRuntime.rules.viewport.du_per_spec_physics_unit * seconds * seconds,
            enginePtmRatio: AppRuntime.mapper.cocosPtmRatio
          }));
        };
        _proto.syncViews = function syncViews() {
          for (var _iterator5 = _createForOfIteratorHelperLoose(this.visuals), _step5; !(_step5 = _iterator5()).done;) {
            var _step5$value = _step5.value,
              id = _step5$value[0],
              _view = _step5$value[1];
            var state = this.adapter.getBody(id);
            if (!state) {
              _view.destroy();
              this.visuals["delete"](id);
              this.visualRadii["delete"](id);
              continue;
            }
            _view.setPosition(state.positionDu.x - AppRuntime.rules.viewport.width_du / 2, state.positionDu.y - AppRuntime.rules.viewport.height_du / 2, 0);
            _view.angle = state.angleRadians * 180 / Math.PI;
          }
          if (this.showBounds) this.drawCup();
        };
        _proto.drawCup = function drawCup() {
          var rules = AppRuntime.rules;
          var cup = rules.cup;
          var shape = CupGeometry.build({
            centerXDu: cup.center_x_du,
            bottomYDu: cup.inner_bottom_y_du,
            topYDu: cup.inner_top_y_du,
            bottomWidthDu: cup.bottom_width_du,
            topWidthDu: cup.top_width_du,
            widthScale: this.cupWidthScale
          });
          var g = this.graphics;
          g.clear();
          g.lineWidth = 5;
          g.strokeColor = new Color(70, 46, 35, 255);
          var toLocal = function toLocal(x, y) {
            return new Vec2(x - rules.viewport.width_du / 2, y - rules.viewport.height_du / 2);
          };
          if (this.showBounds) {
            g.moveTo(toLocal(shape.leftBottom.x, shape.leftBottom.y).x, toLocal(shape.leftBottom.x, shape.leftBottom.y).y);
            g.lineTo(toLocal(shape.leftTop.x, shape.leftTop.y).x, toLocal(shape.leftTop.x, shape.leftTop.y).y);
            g.moveTo(toLocal(shape.rightBottom.x, shape.rightBottom.y).x, toLocal(shape.rightBottom.x, shape.rightBottom.y).y);
            g.lineTo(toLocal(shape.rightTop.x, shape.rightTop.y).x, toLocal(shape.rightTop.x, shape.rightTop.y).y);
            g.moveTo(toLocal(shape.leftBottom.x, shape.leftBottom.y).x, toLocal(shape.leftBottom.x, shape.leftBottom.y).y);
            g.lineTo(toLocal(shape.rightBottom.x, shape.rightBottom.y).x, toLocal(shape.rightBottom.x, shape.rightBottom.y).y);
            g.stroke();
            for (var _iterator6 = _createForOfIteratorHelperLoose(this.visuals), _step6; !(_step6 = _iterator6()).done;) {
              var _step6$value = _step6.value,
                id = _step6$value[0];
              var state = this.adapter.getBody(id);
              if (!state) continue;
              var bodyRadius = this.visualRadii.get(id);
              if (!bodyRadius) continue;
              var p = toLocal(state.positionDu.x, state.positionDu.y);
              g.circle(p.x, p.y, bodyRadius);
              g.stroke();
            }
          }
          var dangerY = cup.danger_line_y_du - rules.viewport.height_du / 2;
          g.lineWidth = 1;
          g.strokeColor = new Color(220, 75, 70, 180);
          g.moveTo(-rules.viewport.width_du / 2, dangerY);
          g.lineTo(rules.viewport.width_du / 2, dangerY);
          g.stroke();
        };
        _proto.createOverlay = function createOverlay() {
          var _this$diagnostics;
          if (!this.node.isValid || (_this$diagnostics = this.diagnostics) != null && _this$diagnostics.node.isValid) return;
          var overlay = new Node('PhysicsLabDiagnostics');
          this.node.addChild(overlay);
          var ui = overlay.addComponent(UITransform);
          ui.setContentSize(720, 260);
          this.diagnostics = overlay.addComponent(Label);
          this.diagnostics.fontSize = 18;
          this.diagnostics.lineHeight = 23;
          this.diagnostics.overflow = Label.Overflow.CLAMP;
          this.diagnostics.enableWrapText = true;
          overlay.setPosition(new Vec3(-8, 535, 0));
          this.createTouchControls();
        };
        _proto.createTouchControls = function createTouchControls() {
          var _this$touchControls,
            _this12 = this;
          (_this$touchControls = this.touchControls) == null || _this$touchControls.destroy();
          var root = this.touchControls = new Node('P1TouchControls');
          this.node.addChild(root);
          var viewportScale = Math.min(view.getScaleX(), view.getScaleY());
          var compactScale = viewportScale < 0.35 ? 44 / (96 * viewportScale) : 1;
          root.setScale(compactScale, compactScale, 1);
          var actions = [['P', -180, viewportScale < 0.35 ? -205 / compactScale : -500, function () {
            return _this12.pause();
          }], ['R', -60, viewportScale < 0.35 ? -205 / compactScale : -500, function () {
            return _this12.resume();
          }], ['3', 60, viewportScale < 0.35 ? -205 / compactScale : -500, function () {
            return _this12.spawnNineSizes();
          }], ['4', 180, viewportScale < 0.35 ? -205 / compactScale : -500, function () {
            return _this12.startPressureTest('original');
          }], ['N', -180, viewportScale < 0.35 ? -300 / compactScale : -610, function () {
            return _this12.runNarrowestCup();
          }], ['G', -60, viewportScale < 0.35 ? -300 / compactScale : -610, function () {
            return _this12.toggleGallery();
          }], ['‹', 60, viewportScale < 0.35 ? -300 / compactScale : -610, function () {
            var _this12$gallery;
            return (_this12$gallery = _this12.gallery) == null ? void 0 : _this12$gallery.turn(-1);
          }], ['›', 180, viewportScale < 0.35 ? -300 / compactScale : -610, function () {
            var _this12$gallery2;
            return (_this12$gallery2 = _this12.gallery) == null ? void 0 : _this12$gallery2.turn(1);
          }]];
          actions.forEach(function (_ref) {
            var text = _ref[0],
              x = _ref[1],
              y = _ref[2],
              activate = _ref[3];
            var button = new Node("Touch-" + text);
            root.addChild(button);
            button.setPosition(x, y, 0);
            button.addComponent(UITransform).setContentSize(100, 96);
            button.addComponent(BlockInputEvents);
            var background = button.addComponent(Graphics);
            background.fillColor = new Color(253, 246, 230, 242);
            background.roundRect(-48, -46, 96, 92, 12);
            background.fill();
            var labelNode = new Node('TouchLabel');
            button.addChild(labelNode);
            labelNode.addComponent(UITransform).setContentSize(100, 96);
            var label = labelNode.addComponent(Label);
            label.string = text;
            label.fontSize = 30;
            label.lineHeight = 36;
            label.color = new Color(61, 42, 35);
            label.overflow = Label.Overflow.CLAMP;
            button.on(Node.EventType.TOUCH_END, function (event) {
              event.propagationStopped = true;
              activate();
            }, _this12);
          });
        };
        _proto.refreshDiagnostics = function refreshDiagnostics() {
          var _this$diagnostics2, _this$clock$stepSecon, _this$clock5, _this$clock$tick3, _this$clock6, _this$adapter$entityC, _this$adapter2, _this$adapter$contact, _this$adapter3, _this$adapter$listene, _this$adapter4;
          if (!((_this$diagnostics2 = this.diagnostics) != null && _this$diagnostics2.isValid)) return;
          this.hudRefreshMs += Math.max(0, (_this$clock$stepSecon = (_this$clock5 = this.clock) == null ? void 0 : _this$clock5.stepSeconds) != null ? _this$clock$stepSecon : 1 / 60) * 1000;
          if (this.diagnostics.string === this.lastHudText && this.hudRefreshMs < 100) return;
          this.hudRefreshMs = 0;
          var tick = (_this$clock$tick3 = (_this$clock6 = this.clock) == null ? void 0 : _this$clock6.tick) != null ? _this$clock$tick3 : 0;
          var entities = (_this$adapter$entityC = (_this$adapter2 = this.adapter) == null ? void 0 : _this$adapter2.entityCount) != null ? _this$adapter$entityC : 0;
          this.diagnostics.color = this.ready ? new Color(61, 42, 35) : new Color(255, 255, 255);
          this.lastHudText = "PhysicsLab \xB7 " + this.message + "\nTick " + tick + " | \u5B9E\u4F53 " + entities + " | \u63A5\u89E6 " + ((_this$adapter$contact = (_this$adapter3 = this.adapter) == null ? void 0 : _this$adapter3.contactCount) != null ? _this$adapter$contact : 0) + " | \u76D1\u542C " + ((_this$adapter$listene = (_this$adapter4 = this.adapter) == null ? void 0 : _this$adapter4.listenerCount) != null ? _this$adapter$listene : 0) + " | \u8D34\u56FE " + this.art.loadedCount + " | \u6E32\u67D3 " + this.renderHz + "fps / \u7269\u7406 60Hz\n[1]\u5355\u5706 [2]\u4E09\u5706 [3]\u4E5D\u5C3A\u5BF8 [4]\u538B\u529B [5]30fps [6]60fps [V]120tick [N]\u6700\u7A84\u676F [P]\u6682\u505C [R]\u6062\u590D [C]\u91CD\u5EFA [X]20\u6B21 [B]\u78B0\u649E\u7EBF [G]\u7D20\u6750 [T]\u91CD\u8BD5";
          this.diagnostics.string = this.lastHudText;
        };
        _proto.disposeViews = function disposeViews() {
          for (var _iterator7 = _createForOfIteratorHelperLoose(this.visuals.values()), _step7; !(_step7 = _iterator7()).done;) {
            var node = _step7.value;
            if (node.isValid) node.destroy();
          }
          this.visuals.clear();
          this.visualRadii.clear();
        };
        _proto.createSceneArt = function createSceneArt() {
          var _this13 = this;
          var rules = AppRuntime.rules;
          this.cupSprites = [];
          this.rearArt = new Node('BackgroundAndCupRear');
          this.node.addChild(this.rearArt);
          this.rearArt.setSiblingIndex(0);
          this.frontArt = new Node('CupFrontAndDiagnostics');
          this.node.addChild(this.frontArt);
          this.frontArt.setSiblingIndex(1);
          this.art.createSprite(this.rearArt, 'bg_shop_base', rules.viewport.width_du, rules.viewport.height_du);
          var shadow = this.art.createSprite(this.rearArt, 'spr_cup_shadow', 512, 128);
          shadow.setPosition(rules.cup.center_x_du - rules.viewport.width_du / 2, rules.cup.inner_bottom_y_du - 30 - rules.viewport.height_du / 2, 0);
          var layer = function layer(parent, suffix) {
            var assetId = "spr_cup_classic_" + suffix;
            var size = _this13.art.catalog.select(assetId, 1000).size;
            var sprite = _this13.art.createSprite(parent, assetId, size[0], size[1]);
            _this13.cupSprites.push(sprite);
            sprite.setPosition(-rules.viewport.width_du / 2, 200 - rules.viewport.height_du / 2, 0);
          };
          ['back', 'tea', 'rim_back'].forEach(function (suffix) {
            return layer(_this13.rearArt, suffix);
          });
          ['front', 'rim_front', 'base', 'label'].forEach(function (suffix) {
            return layer(_this13.frontArt, suffix);
          });
          var bounds = new Node('PhysicsDebugBounds');
          this.frontArt.addChild(bounds);
          this.graphics = bounds.addComponent(Graphics);
        };
        _proto.applyCupWidthScale = function applyCupWidthScale(scale) {
          this.cupWidthScale = scale;
          for (var _iterator8 = _createForOfIteratorHelperLoose(this.cupSprites), _step8; !(_step8 = _iterator8()).done;) {
            var sprite = _step8.value;
            sprite.setScale(scale, 1, 1);
            sprite.setPosition(-AppRuntime.rules.viewport.width_du / 2 * scale, 200 - AppRuntime.rules.viewport.height_du / 2, 0);
          }
        };
        _proto.toggleGallery = function toggleGallery() {
          var _this$touchControls3,
            _this$diagnostics4,
            _this14 = this;
          if (this.gallery) {
            var _this$touchControls2, _this$diagnostics3, _this$clock7;
            this.gallery.close();
            this.gallery = null;
            if ((_this$touchControls2 = this.touchControls) != null && _this$touchControls2.isValid) this.touchControls.active = true;
            if ((_this$diagnostics3 = this.diagnostics) != null && _this$diagnostics3.isValid) this.diagnostics.node.active = true;
            this.pauseGate.release('GALLERY');
            if (this.resumeAfterGallery && this.galleryPauseSerial === this.pauseGate.interruptionSerial && (_this$clock7 = this.clock) != null && _this$clock7.paused && this.pauseGate.canAdvance && !AppRuntime.backgrounded) this.clock.resume();
            this.resumeAfterGallery = false;
            return;
          }
          this.resumeAfterGallery = !this.clock.paused && this.pauseGate.canAdvance;
          this.pauseGate.hold('GALLERY');
          this.galleryPauseSerial = this.pauseGate.interruptionSerial;
          this.clock.pause();
          if ((_this$touchControls3 = this.touchControls) != null && _this$touchControls3.isValid) this.touchControls.active = false;
          if ((_this$diagnostics4 = this.diagnostics) != null && _this$diagnostics4.isValid) this.diagnostics.node.active = false;
          this.gallery = new ArtGallery(this.node, this.art, function () {
            return _this14.toggleGallery();
          });
        };
        _proto.onLifecycleState = function onLifecycleState(state) {
          if (state.resumeRequired) this.pauseGate.hold('RESUME_REQUIRED');
          if (state.backgrounded) {
            var _this$clock8;
            this.resumeAfterGallery = false;
            this.pauseGate.hold('BACKGROUND');
            (_this$clock8 = this.clock) == null || _this$clock8.pause();
            this.message = '已暂停：宿主隐藏；返回后按 R 显式恢复';
          } else {
            var _this$clock9;
            this.pauseGate.release('BACKGROUND');
            if (this.ready && (_this$clock9 = this.clock) != null && _this$clock9.paused) this.message = '宿主已显示；物理保持暂停，请按 R 恢复';
          }
        };
        _proto.pauseReasonMask = function pauseReasonMask() {
          return this.pauseGate.mask();
        };
        _proto.debugSnapshot = function debugSnapshot() {
          var _this$clock$tick4, _this$clock10, _this$adapter$stepCou, _this$adapter5, _this$clock$paused, _this$clock11, _this$adapter$entityC2, _this$adapter6, _this$adapter$contact2, _this$adapter7, _this$adapter$contact3, _this$adapter8, _this$adapter$contact4, _this$adapter9, _this$adapter$listene2, _this$adapter10, _this$adapter$getCont, _this$adapter11, _this$adapter$cupSegm, _this$adapter12, _this$contactRebuildT3;
          var bodies = [];
          if (this.adapter) this.adapter.visitBodySamples(function (id, r, x, y, vx, vy, awake) {
            return bodies.push([id, r, x, y, vx, vy, awake ? 1 : 0]);
          });
          return {
            buildId: this.probe.identity.buildId,
            attemptId: this.probe.identity.attemptId,
            ready: this.ready,
            tick: (_this$clock$tick4 = (_this$clock10 = this.clock) == null ? void 0 : _this$clock10.tick) != null ? _this$clock$tick4 : -1,
            stepCount: (_this$adapter$stepCou = (_this$adapter5 = this.adapter) == null ? void 0 : _this$adapter5.stepCount) != null ? _this$adapter$stepCou : -1,
            paused: (_this$clock$paused = (_this$clock11 = this.clock) == null ? void 0 : _this$clock11.paused) != null ? _this$clock$paused : true,
            worldId: this.probe.identity.worldId,
            pauseReasons: this.pauseGate.snapshot(),
            interruptionSerial: this.pauseGate.interruptionSerial,
            entityCount: (_this$adapter$entityC2 = (_this$adapter6 = this.adapter) == null ? void 0 : _this$adapter6.entityCount) != null ? _this$adapter$entityC2 : 0,
            contactCount: (_this$adapter$contact2 = (_this$adapter7 = this.adapter) == null ? void 0 : _this$adapter7.contactCount) != null ? _this$adapter$contact2 : 0,
            contactBeginEvents: (_this$adapter$contact3 = (_this$adapter8 = this.adapter) == null ? void 0 : _this$adapter8.contactBeginEvents) != null ? _this$adapter$contact3 : 0,
            contactEndEvents: (_this$adapter$contact4 = (_this$adapter9 = this.adapter) == null ? void 0 : _this$adapter9.contactEndEvents) != null ? _this$adapter$contact4 : 0,
            listenerCount: (_this$adapter$listene2 = (_this$adapter10 = this.adapter) == null ? void 0 : _this$adapter10.listenerCount) != null ? _this$adapter$listene2 : 0,
            bodies: bodies,
            contacts: (_this$adapter$getCont = (_this$adapter11 = this.adapter) == null ? void 0 : _this$adapter11.getContacts()) != null ? _this$adapter$getCont : [],
            config: AppRuntime.rules ? {
              levelRadii: AppRuntime.rules.ingredients.map(function (item) {
                return {
                  level: item.level,
                  radiusDu: item.radius_du
                };
              }),
              cupWidthScales: AppRuntime.rules.stages.map(function (stage) {
                return {
                  id: stage.id,
                  scale: stage.cup_width_scale
                };
              }),
              cupSegments: (_this$adapter$cupSegm = (_this$adapter12 = this.adapter) == null ? void 0 : _this$adapter12.cupSegments.map(function (segment) {
                return {
                  kind: segment.kind,
                  innerStart: segment.innerStart,
                  innerEnd: segment.innerEnd,
                  outward: segment.outward,
                  thicknessDu: segment.thicknessDu
                };
              })) != null ? _this$adapter$cupSegm : []
            } : null,
            queue: this.queueState ? _extends({}, this.queueState, {
              records: this.queueState.records.slice()
            }) : null,
            contactRebuild: this.contactRebuildTask ? {
              attemptId: this.contactRebuildTask.attemptId,
              token: this.contactRebuildTask.token,
              interruptAt: this.contactRebuildTask.interruptAt,
              round: this.contactRebuildTask.round,
              phase: this.contactRebuildTask.phase,
              status: this.contactRebuildTask.status,
              failure: this.contactRebuildTask.failure,
              failureDiagnostics: (_this$contactRebuildT3 = this.contactRebuildTask.failureDiagnostics) != null ? _this$contactRebuildT3 : null,
              records: this.contactRebuildTask.records.map(function (record) {
                return _extends({}, record);
              })
            } : null,
            contactRebuildHistory: this.contactRebuildHistory.map(function (entry) {
              return _extends({}, entry, {
                records: entry.records.map(function (record) {
                  return _extends({}, record);
                })
              });
            }),
            contactMatrix: this.contactMatrixTask ? {
              phase: this.contactMatrixTask.phase,
              result: JSON.parse(JSON.stringify(this.contactMatrixTask.result))
            } : null,
            wallMatrix: this.wallMatrixTask ? {
              status: this.wallMatrixTask.status,
              phase: this.wallMatrixTask.phase,
              index: this.wallMatrixTask.index,
              caseCount: this.wallMatrixTask.cases.length,
              failure: this.wallMatrixTask.failure,
              records: this.wallMatrixTask.records.map(function (record) {
                return _extends({}, record);
              })
            } : null,
            loadedArtVariants: this.art.loadedVariantSnapshot(),
            lifecycle: HostLifecycleCoordinator.snapshot(),
            probe: this.probe["export"](),
            message: this.message
          };
        };
        _proto.runtimeStatus = function runtimeStatus() {
          var _this$clock$tick5, _this$clock12, _this$adapter$stepCou2, _this$adapter13, _this$clock$paused2, _this$clock13, _this$adapter$entityC3, _this$adapter14, _this$adapter$contact5, _this$adapter15, _this$adapter$contact6, _this$adapter16, _this$adapter$contact7, _this$adapter17, _this$adapter$listene3, _this$adapter18, _cc$ENGINE_VERSION, _cc, _AppRuntime$mapper$co2, _AppRuntime$mapper2, _AppRuntime$rules$ing, _AppRuntime$rules, _this$contactRebuildT4;
          return {
            buildId: this.probe.identity.buildId,
            attemptId: this.probe.identity.attemptId,
            ready: this.ready,
            loading: this.loading,
            tick: (_this$clock$tick5 = (_this$clock12 = this.clock) == null ? void 0 : _this$clock12.tick) != null ? _this$clock$tick5 : -1,
            stepCount: (_this$adapter$stepCou2 = (_this$adapter13 = this.adapter) == null ? void 0 : _this$adapter13.stepCount) != null ? _this$adapter$stepCou2 : -1,
            paused: (_this$clock$paused2 = (_this$clock13 = this.clock) == null ? void 0 : _this$clock13.paused) != null ? _this$clock$paused2 : true,
            pauseReasons: this.pauseGate.snapshot(),
            interruptionSerial: this.pauseGate.interruptionSerial,
            entityCount: (_this$adapter$entityC3 = (_this$adapter14 = this.adapter) == null ? void 0 : _this$adapter14.entityCount) != null ? _this$adapter$entityC3 : 0,
            contactCount: (_this$adapter$contact5 = (_this$adapter15 = this.adapter) == null ? void 0 : _this$adapter15.contactCount) != null ? _this$adapter$contact5 : 0,
            contactBeginEvents: (_this$adapter$contact6 = (_this$adapter16 = this.adapter) == null ? void 0 : _this$adapter16.contactBeginEvents) != null ? _this$adapter$contact6 : 0,
            contactEndEvents: (_this$adapter$contact7 = (_this$adapter17 = this.adapter) == null ? void 0 : _this$adapter17.contactEndEvents) != null ? _this$adapter$contact7 : 0,
            listenerCount: (_this$adapter$listene3 = (_this$adapter18 = this.adapter) == null ? void 0 : _this$adapter18.listenerCount) != null ? _this$adapter$listene3 : 0,
            engine: {
              cocos: (_cc$ENGINE_VERSION = (_cc = globalThis.cc) == null ? void 0 : _cc.ENGINE_VERSION) != null ? _cc$ENGINE_VERSION : 'not-exposed',
              physicsBackend: PhysicsSystem2D.PHYSICS_BOX2D ? 'BOX2D' : PhysicsSystem2D.PHYSICS_BOX2D_WASM ? 'BOX2D_WASM' : 'OTHER',
              autoSimulation: PhysicsSystem2D.instance.autoSimulation,
              fixedTimeStep: PhysicsSystem2D.instance.fixedTimeStep,
              ptmRatio: (_AppRuntime$mapper$co2 = (_AppRuntime$mapper2 = AppRuntime.mapper) == null ? void 0 : _AppRuntime$mapper2.cocosPtmRatio) != null ? _AppRuntime$mapper$co2 : null
            },
            levelRadii: (_AppRuntime$rules$ing = (_AppRuntime$rules = AppRuntime.rules) == null ? void 0 : _AppRuntime$rules.ingredients.map(function (item) {
              return {
                level: item.level,
                radiusDu: item.radius_du
              };
            })) != null ? _AppRuntime$rules$ing : [],
            cupWidthScale: this.cupWidthScale,
            queue: this.queueState ? {
              taskId: this.queueState.taskId,
              state: this.queueState.state,
              level: this.queueState.level,
              batchAttempt: this.queueState.batchAttempt,
              recordCount: this.queueState.records.length
            } : null,
            contactRebuild: this.contactRebuildTask ? {
              attemptId: this.contactRebuildTask.attemptId,
              round: this.contactRebuildTask.round,
              phase: this.contactRebuildTask.phase,
              status: this.contactRebuildTask.status,
              failure: this.contactRebuildTask.failure,
              failureDiagnostics: (_this$contactRebuildT4 = this.contactRebuildTask.failureDiagnostics) != null ? _this$contactRebuildT4 : null,
              records: this.contactRebuildTask.records.map(function (record) {
                return _extends({}, record);
              })
            } : null,
            contactRebuildHistory: this.contactRebuildHistory.map(function (entry) {
              return {
                attemptId: entry.attemptId,
                status: entry.status,
                failure: entry.failure,
                recordCount: entry.records.length
              };
            }),
            contactMatrix: this.contactMatrixTask ? {
              phase: this.contactMatrixTask.phase,
              result: this.contactMatrixTask.result
            } : null,
            wallMatrix: this.wallMatrixTask ? {
              status: this.wallMatrixTask.status,
              phase: this.wallMatrixTask.phase,
              index: this.wallMatrixTask.index,
              caseCount: this.wallMatrixTask.cases.length,
              failure: this.wallMatrixTask.failure
            } : null,
            lifecycle: HostLifecycleCoordinator.snapshot(),
            message: this.message
          };
        };
        _proto.onRetryTouch = function onRetryTouch() {
          if (!this.ready && !this.loading) void this.initializeLab();
        };
        _proto.onKeyDown = function onKeyDown(event) {
          if (!this.ready) {
            if (event.keyCode === KeyCode.KEY_T) void this.initializeLab();
            return;
          }
          if (event.keyCode === KeyCode.KEY_G) {
            this.toggleGallery();
            return;
          }
          if (this.gallery) {
            if (event.keyCode === KeyCode.ARROW_LEFT) this.gallery.turn(-1);
            if (event.keyCode === KeyCode.ARROW_RIGHT) this.gallery.turn(1);
            return;
          }
          switch (event.keyCode) {
            case KeyCode.KEY_B:
              this.showBounds = !this.showBounds;
              this.drawCup();
              break;
            case KeyCode.KEY_V:
              this.runFixedStepSample();
              break;
            case KeyCode.KEY_N:
              this.runNarrowestCup();
              break;
            case KeyCode.DIGIT_1:
              this.runSingleFall();
              break;
            case KeyCode.DIGIT_2:
              this.spawnThree();
              break;
            case KeyCode.DIGIT_3:
              this.spawnNineSizes();
              break;
            case KeyCode.DIGIT_4:
              this.pressureTest();
              break;
            case KeyCode.DIGIT_5:
              this.compareRenderRate(30);
              break;
            case KeyCode.DIGIT_6:
              this.compareRenderRate(60);
              break;
            case KeyCode.KEY_P:
              this.pause();
              break;
            case KeyCode.KEY_R:
              this.resume();
              break;
            case KeyCode.KEY_C:
              this.clearAndRebuild();
              break;
            case KeyCode.KEY_X:
              this.rebuildTwentyTimes();
              break;
          }
        };
        _createClass(PhysicsLab, [{
          key: "queueState",
          get: function get() {
            var _this$queueLedger$sta, _this$queueLedger2;
            return (_this$queueLedger$sta = (_this$queueLedger2 = this.queueLedger) == null ? void 0 : _this$queueLedger2.state) != null ? _this$queueLedger$sta : null;
          }
        }]);
        return PhysicsLab;
      }(Component)) || _class));
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/ReviveLedger.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
  var _extends, cclegacy;
  return {
    setters: [function (module) {
      _extends = module.extends;
    }, function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      cclegacy._RF.push({}, "6403ai5TQtCi4CVfgygUQCU", "ReviveLedger", undefined);
      /** Quota and eligibility rules for the once-per-run spill revive; pure so tools can test them without storage. */
      var ReviveLedger = exports('ReviveLedger', /*#__PURE__*/function () {
        function ReviveLedger() {}
        ReviveLedger.dayKey = function dayKey(nowMs) {
          return new Date(nowMs + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
        };
        ReviveLedger.normalize = function normalize(ledger, dayKey) {
          if (ledger.dayKey === dayKey) return ledger;
          return _extends({}, ledger, {
            dayKey: dayKey,
            dailyGranted: ledger.receipts.filter(function (receipt) {
              return receipt.dayKey === dayKey;
            }).length
          });
        };
        ReviveLedger.grantedForDay = function grantedForDay(ledger, day) {
          var receipts = ledger.receipts.filter(function (receipt) {
            return receipt.dayKey === day;
          }).length;
          return Math.max(ledger.dayKey === day ? ledger.dailyGranted : 0, receipts);
        };
        ReviveLedger.dailyRemaining = function dailyRemaining(ledger, policy, today) {
          return Math.max(0, policy.maxDailyRevives - this.grantedForDay(ledger, today));
        };
        ReviveLedger.pendingForRun = function pendingForRun(ledger, runId) {
          var _ledger$pendingAttemp;
          return runId && ((_ledger$pendingAttemp = ledger.pendingAttempt) == null ? void 0 : _ledger$pendingAttemp.runId) === runId ? ledger.pendingAttempt : null;
        };
        ReviveLedger.hasReceipt = function hasReceipt(ledger, attemptId) {
          return ledger.receipts.some(function (receipt) {
            return receipt.attemptId === attemptId;
          });
        };
        ReviveLedger.checkOffer = function checkOffer(input) {
          var policy = input.policy,
            capability = input.capability,
            profile = input.profile,
            run = input.run,
            foregroundSeconds = input.foregroundSeconds,
            tutorialComplete = input.tutorialComplete,
            nowMs = input.nowMs;
          if (!policy.enabled) return {
            allowed: false,
            block: 'POLICY_DISABLED'
          };
          if (capability === 'UNCONFIGURED') return {
            allowed: false,
            block: 'AD_UNCONFIGURED'
          };
          if (capability !== 'SUPPORTED') return {
            allowed: false,
            block: 'AD_UNSUPPORTED'
          };
          if (!run || run.state !== 'PAUSED' || !run.revive.pendingFailure) return {
            allowed: false,
            block: 'NOT_SPILL_PENDING'
          };
          if (run.revive.used >= policy.maxRevivesPerRun) return {
            allowed: false,
            block: 'RUN_LIMIT'
          };
          var today = this.dayKey(nowMs);
          if (this.dailyRemaining(profile.rewardedRevive, policy, today) < 1) return {
            allowed: false,
            block: 'DAILY_LIMIT'
          };
          if (policy.requireTutorialComplete && !tutorialComplete) return {
            allowed: false,
            block: 'TUTORIAL_REQUIRED'
          };
          if (policy.requireFirstNaturalRunCompleted && !profile.firstNaturalRunCompleted) return {
            allowed: false,
            block: 'FIRST_RUN_REQUIRED'
          };
          if (!(foregroundSeconds >= policy.minForegroundSecondsFirstSession)) return {
            allowed: false,
            block: 'FOREGROUND_REQUIRED'
          };
          if (this.pendingForRun(profile.rewardedRevive, run.runId)) return {
            allowed: false,
            block: 'PENDING_ATTEMPT'
          };
          return {
            allowed: true,
            block: null
          };
        };
        ReviveLedger.receiptFor = function receiptFor(pending, nowMs) {
          return {
            attemptId: pending.attemptId,
            runId: pending.runId,
            failureId: pending.failureId,
            rewardKind: 'spill_revive',
            amount: 1,
            policyVersion: pending.policyVersion,
            dayKey: pending.dayKey,
            status: 'COMMITTED',
            grantedAt: nowMs
          };
        };
        ReviveLedger.grant = function grant(ledger, receipt, activeRunId) {
          var existing = ledger.receipts.find(function (item) {
            return item.attemptId === receipt.attemptId;
          });
          if (existing) {
            if (existing.runId !== receipt.runId || existing.failureId !== receipt.failureId || existing.rewardKind !== receipt.rewardKind || existing.amount !== receipt.amount || existing.policyVersion !== receipt.policyVersion || existing.dayKey !== receipt.dayKey) throw new Error('REWARD_RECEIPT_CONFLICT');
            return ledger;
          }
          var receipts = this.prune([].concat(ledger.receipts, [receipt]), receipt.dayKey, activeRunId);
          var priorCount = this.grantedForDay(ledger, receipt.dayKey);
          var priorReceiptCount = ledger.receipts.filter(function (item) {
            return item.dayKey === receipt.dayKey;
          }).length;
          var countForReceiptDay = priorCount > priorReceiptCount ? priorCount + 1 : receipts.filter(function (item) {
            return item.dayKey === receipt.dayKey;
          }).length;
          var keepCurrentDay = !!ledger.dayKey && ledger.dayKey > receipt.dayKey;
          return {
            dayKey: keepCurrentDay ? ledger.dayKey : receipt.dayKey,
            dailyGranted: keepCurrentDay ? ledger.dailyGranted : countForReceiptDay,
            pendingAttempt: null,
            receipts: receipts
          };
        };
        ReviveLedger.clearPending = function clearPending(ledger) {
          return _extends({}, ledger, {
            pendingAttempt: null
          });
        };
        ReviveLedger.prune = function prune(receipts, keepDayKey, activeRunId) {
          var floor = new Date(keepDayKey + "T00:00:00Z").getTime() - 6 * 24 * 60 * 60 * 1000;
          return receipts.filter(function (receipt) {
            return receipt.runId === activeRunId || new Date(receipt.dayKey + "T00:00:00Z").getTime() >= floor;
          }).slice(-64);
        };
        return ReviveLedger;
      }());
      ReviveLedger.EMPTY = {
        dayKey: null,
        dailyGranted: 0,
        pendingAttempt: null,
        receipts: []
      };
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/RewardedAdCoordinator.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      cclegacy._RF.push({}, "9e0a7xiUdRLip82jC0edKWw", "RewardedAdCoordinator", undefined);
      /** App-wide mutual exclusion for rewarded placements: only one SDK show may be in flight per app launch. */
      var RewardedAdCoordinator = exports('RewardedAdCoordinator', /*#__PURE__*/function () {
        function RewardedAdCoordinator() {}
        RewardedAdCoordinator.claim = function claim(kind) {
          if (this.active) return false;
          this.active = kind;
          return true;
        };
        RewardedAdCoordinator.release = function release(kind) {
          if (this.active === kind) this.active = null;
        };
        RewardedAdCoordinator.busy = function busy() {
          return this.active !== null;
        };
        RewardedAdCoordinator.current = function current() {
          return this.active;
        };
        return RewardedAdCoordinator;
      }());
      RewardedAdCoordinator.active = null;
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/RewardedAdPolicyLoader.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      cclegacy._RF.push({}, "af3076NZ4NJ06JQhIA/LqfO", "RewardedAdPolicyLoader", undefined);
      /** Validates the runtime rewarded-ad policy. Any malformed file keeps the placement closed. */
      var RewardedAdPolicyLoader = exports('RewardedAdPolicyLoader', /*#__PURE__*/function () {
        function RewardedAdPolicyLoader() {}
        RewardedAdPolicyLoader.validate = function validate(raw) {
          try {
            if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('激励广告策略必须是对象');
            var p = raw;
            if (typeof p.policyVersion !== 'string' || !p.policyVersion.trim()) throw new Error('policyVersion 缺失');
            if (typeof p.enabled !== 'boolean') throw new Error('enabled 必须是 boolean');
            if (p.adUnitId !== null && (typeof p.adUnitId !== 'string' || !p.adUnitId.trim())) throw new Error('adUnitId 必须是 null 或非空字符串');
            if (p.placement !== 'extra-shake') throw new Error('placement 必须为 extra-shake');
            var amount = function amount(key, max) {
              var value = p[key];
              if (!Number.isSafeInteger(value) || Number(value) < 0 || Number(value) > max) throw new Error(key + " \u5FC5\u987B\u662F 0.." + max + " \u7684\u6574\u6570");
              return Number(value);
            };
            var maxPerRun = amount('maxExtraShakesPerRun', 5);
            var maxDaily = amount('maxDailyRewardedShakes', 5);
            var foreground = amount('minForegroundSecondsFirstSession', 600);
            if (typeof p.requireTutorialComplete !== 'boolean' || typeof p.requireFirstNaturalRunCompleted !== 'boolean') throw new Error('资格开关必须是 boolean');
            if (maxPerRun < 1) throw new Error('maxExtraShakesPerRun 至少为 1');
            if (maxDaily > 5) throw new Error('maxDailyRewardedShakes 不得超过每日 5 次');
            var policy = {
              enabled: p.enabled,
              policyVersion: p.policyVersion,
              adUnitId: p.adUnitId,
              placement: 'extra-shake',
              maxExtraShakesPerRun: maxPerRun,
              maxDailyRewardedShakes: maxDaily,
              minForegroundSecondsFirstSession: foreground,
              requireTutorialComplete: p.requireTutorialComplete,
              requireFirstNaturalRunCompleted: p.requireFirstNaturalRunCompleted
            };
            return {
              ok: true,
              data: Object.freeze(policy)
            };
          } catch (error) {
            return {
              ok: false,
              error: {
                code: 'REWARD_POLICY_INVALID',
                message: error instanceof Error ? error.message : String(error),
                retryable: false
              }
            };
          }
        };
        return RewardedAdPolicyLoader;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/RewardedAdProviderFactory.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './FakeRewardedAdProvider.ts', './TapRewardedAdProvider.ts'], function (exports) {
  var _extends, cclegacy, FakeRewardedAdProvider, TapRewardedAdProvider;
  return {
    setters: [function (module) {
      _extends = module.extends;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      FakeRewardedAdProvider = module.FakeRewardedAdProvider;
    }, function (module) {
      TapRewardedAdProvider = module.TapRewardedAdProvider;
    }],
    execute: function () {
      exports({
        createReviveAdEnvironment: createReviveAdEnvironment,
        createRewardedAdEnvironment: createRewardedAdEnvironment
      });
      cclegacy._RF.push({}, "f4ef87DbTlNw4zysVhouORa", "RewardedAdProviderFactory", undefined);
      /**
       * Release/Tap builds always use the real Tap adapter. The debug branch is removed by
       * strip_p1c_release_debug.cjs together with the whole debug directory.
       */
      function createRewardedAdEnvironment(policy) {
        {
          var mode = FakeRewardedAdProvider.modeFromQuery();
          if (mode) {
            console.info('[debug-mock] rewarded shake enabled via ?rewardedMock, real ads are NOT shown');
            return {
              provider: new FakeRewardedAdProvider(mode, policy),
              policy: _extends({}, policy, {
                enabled: true,
                adUnitId: 'debug-mock'
              })
            };
          }
        }
        return {
          provider: new TapRewardedAdProvider(policy),
          policy: policy
        };
      }
      function createReviveAdEnvironment(policy) {
        {
          var mode = FakeRewardedAdProvider.modeFromQuery();
          if (mode) {
            console.info('[debug-mock] spill revive enabled via ?rewardedMock, real ads are NOT shown');
            // Local closed-loop testing only: bypass first-session gates so a fixture spill can reach the offer.
            return {
              provider: new FakeRewardedAdProvider(mode, policy),
              policy: _extends({}, policy, {
                enabled: true,
                adUnitId: 'debug-mock',
                minForegroundSecondsFirstSession: 0,
                requireTutorialComplete: false,
                requireFirstNaturalRunCompleted: false
              })
            };
          }
        }
        return {
          provider: new TapRewardedAdProvider(policy),
          policy: policy
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/RewardedShakeService.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './RewardLedger.ts', './RewardedAdCoordinator.ts'], function (exports) {
  var _createClass, _asyncToGenerator, _regeneratorRuntime, _extends, cclegacy, RewardLedger, RewardedAdCoordinator;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
      _asyncToGenerator = module.asyncToGenerator;
      _regeneratorRuntime = module.regeneratorRuntime;
      _extends = module.extends;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      RewardLedger = module.RewardLedger;
    }, function (module) {
      RewardedAdCoordinator = module.RewardedAdCoordinator;
    }],
    execute: function () {
      cclegacy._RF.push({}, "9f659ujAaJPc4/BnCI89N/p", "RewardedShakeService", undefined);
      var copy = function copy(value) {
        return JSON.parse(JSON.stringify(value));
      };
      function makeUuid() {
        var cryptoApi = globalThis.crypto;
        if (cryptoApi != null && cryptoApi.randomUUID) return cryptoApi.randomUUID();
        var bytes = new Uint8Array(16);
        if (cryptoApi != null && cryptoApi.getRandomValues) cryptoApi.getRandomValues(bytes);else for (var i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
        bytes[6] = bytes[6] & 15 | 64;
        bytes[8] = bytes[8] & 63 | 128;
        var hex = Array.from(bytes, function (value) {
          return value.toString(16).padStart(2, '0');
        }).join('');
        return hex.slice(0, 8) + "-" + hex.slice(8, 12) + "-" + hex.slice(12, 16) + "-" + hex.slice(16, 20) + "-" + hex.slice(20);
      }

      /**
       * App-scoped rewarded-shake state machine. The pending attempt is persisted before show; a grant is
       * committed before the live engine receives it, so a failed save can never leave spendable ghost shakes.
       */
      var RewardedShakeService = exports('RewardedShakeService', /*#__PURE__*/function () {
        function RewardedShakeService(env, repo, now) {
          this.phase = 'IDLE';
          this.message = null;
          this.retrySettle = false;
          this.busy = false;
          this.stalePending = false;
          this.pendingAttempt = null;
          /** Set only after this process receives a strict, attempt-scoped COMPLETED outcome. */
          this.trustedCompletionAttempt = null;
          this.foregroundSeconds = 0;
          this.host = null;
          this.boundRunId = null;
          this.hostGeneration = 0;
          this.env = env;
          this.repo = repo;
          this.now = now;
        }
        RewardedShakeService.create = function create(env, repo, now) {
          if (now === void 0) {
            now = function now() {
              return Date.now();
            };
          }
          var service = new RewardedShakeService(env, repo, now);
          var scope = globalThis;
          if (scope.__milkteaRewardedShake) {
            service.env.provider.dispose();
            return scope.__milkteaRewardedShake;
          }
          scope.__milkteaRewardedShake = service;
          return service;
        };
        var _proto = RewardedShakeService.prototype;
        _proto.bind = function bind(host) {
          var _host$getActiveRunSna, _host$getActiveRunSna2, _host$getBundle;
          var nextRun = (_host$getActiveRunSna = (_host$getActiveRunSna2 = host.getActiveRunSnapshot()) == null ? void 0 : _host$getActiveRunSna2.runId) != null ? _host$getActiveRunSna : null;
          if (this.host !== host || this.boundRunId !== nextRun) {
            this.hostGeneration++;
            this.boundRunId = nextRun;
          }
          this.host = host;
          var ledger = (_host$getBundle = host.getBundle()) == null ? void 0 : _host$getBundle.profile.rewardedShake;
          var run = host.getActiveRunSnapshot();
          this.stalePending = !!(ledger != null && ledger.pendingAttempt && run && ledger.pendingAttempt.runId === run.runId);
          if (!this.busy) {
            this.phase = 'IDLE';
            this.message = this.stalePending ? '上次广告奖励未得到可信完成确认，未发放。' : null;
            this.retrySettle = false;
          }
        };
        _proto.unbind = function unbind(host) {
          if (this.host === host) this.host = null;
        };
        _proto.setForegroundSeconds = function setForegroundSeconds(seconds) {
          this.foregroundSeconds = Math.max(0, seconds);
        };
        _proto.providerDisposed = function providerDisposed() {
          return false;
        };
        _proto.dispose = function dispose() {
          this.env.provider.dispose();
        };
        _proto.getView = function getView() {
          var _this$host$getBundle, _this$host, _this$host$getActiveR, _this$host2, _this$host$isTutorial, _this$host3, _bundle$profile$rewar, _run$shake$extraGrant;
          var bundle = (_this$host$getBundle = (_this$host = this.host) == null ? void 0 : _this$host.getBundle()) != null ? _this$host$getBundle : null;
          var run = (_this$host$getActiveR = (_this$host2 = this.host) == null ? void 0 : _this$host2.getActiveRunSnapshot()) != null ? _this$host$getActiveR : null;
          var check = bundle && run ? RewardLedger.checkOffer({
            policy: this.env.policy,
            capability: this.env.provider.capability(),
            profile: bundle.profile,
            run: run,
            foregroundSeconds: this.foregroundSeconds,
            tutorialComplete: (_this$host$isTutorial = (_this$host3 = this.host) == null ? void 0 : _this$host3.isTutorialComplete()) != null ? _this$host$isTutorial : false,
            nowMs: this.now()
          }) : {
            allowed: false,
            block: 'NO_ACTIVE_RUN'
          };
          var ledger = (_bundle$profile$rewar = bundle == null ? void 0 : bundle.profile.rewardedShake) != null ? _bundle$profile$rewar : RewardLedger.EMPTY;
          var today = RewardLedger.dayKey(this.now());
          return {
            phase: this.phase,
            block: this.stalePending ? 'PENDING_ATTEMPT' : check.block,
            message: this.message,
            retrySettle: this.retrySettle,
            capability: this.env.provider.capability(),
            providerName: this.env.provider.providerName,
            availableExtra: (run == null ? void 0 : run.shake.extraGranted) !== undefined ? Math.max(0, run.shake.extraGranted - run.shake.extraUsed) : 0,
            grantedThisRun: (_run$shake$extraGrant = run == null ? void 0 : run.shake.extraGranted) != null ? _run$shake$extraGrant : 0,
            runLimit: this.env.policy.maxExtraShakesPerRun,
            dailyRemaining: RewardLedger.dailyRemaining(ledger, this.env.policy, today),
            pendingAttempt: this.stalePending || !!(ledger.pendingAttempt && run && ledger.pendingAttempt.runId === run.runId),
            simulated: this.env.provider.providerName !== 'tap'
          };
        };
        _proto.canOffer = function canOffer() {
          var view = this.getView();
          return view.phase === 'IDLE' && view.block === null;
        };
        _proto.openOffer = function openOffer() {
          if (!this.host || this.busy) return;
          var check = this.check();
          if (!check.allowed) {
            this.message = this.blockMessage(check.block);
            this.changed();
            return;
          }
          this.phase = 'OFFER';
          this.message = null;
          this.retrySettle = false;
          this.host.pauseForRewardedAd();
          this.changed();
        };
        _proto.closeOffer = function closeOffer() {
          if (!this.host || this.phase !== 'OFFER' && this.phase !== 'ERROR') return;
          this.phase = 'IDLE';
          this.message = null;
          this.retrySettle = false;
          this.changed();
          this.host.resumeFromRewardedAd(null);
        }
        /** Reopens the pending record so the player can abandon an untrusted attempt. */;
        _proto.openPendingReview = function openPendingReview() {
          var _this$host$getBundle2;
          if (!this.host || this.busy) return;
          var ledger = (_this$host$getBundle2 = this.host.getBundle()) == null ? void 0 : _this$host$getBundle2.profile.rewardedShake;
          var run = this.host.getActiveRunSnapshot();
          if (!(ledger != null && ledger.pendingAttempt) || !run || ledger.pendingAttempt.runId !== run.runId) return;
          this.stalePending = true;
          this.phase = 'ERROR';
          this.retrySettle = false;
          this.message = '上次广告奖励未得到可信完成确认，未发放。可放弃后重新观看。';
          this.host.pauseForRewardedAd();
          this.changed();
        };
        _proto.watch = /*#__PURE__*/function () {
          var _watch = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
            var check, owner, generation, bundle, run, _owner$getActiveRunSn, _owner$getActiveRunSn2, _owner$getActiveRunSn3, attemptId, pending, frozen, pendingCommit, prepared, outcome;
            return _regeneratorRuntime().wrap(function _callee$(_context) {
              while (1) switch (_context.prev = _context.next) {
                case 0:
                  if (!(!this.host || this.phase !== 'OFFER' || this.busy)) {
                    _context.next = 2;
                    break;
                  }
                  return _context.abrupt("return");
                case 2:
                  check = this.check();
                  if (check.allowed) {
                    _context.next = 7;
                    break;
                  }
                  this.message = this.blockMessage(check.block);
                  this.changed();
                  return _context.abrupt("return");
                case 7:
                  owner = this.host, generation = this.hostGeneration;
                  bundle = owner.getBundle();
                  run = owner.getActiveRunSnapshot();
                  if (!(!bundle || !run)) {
                    _context.next = 14;
                    break;
                  }
                  this.message = '当前局不可用';
                  this.changed();
                  return _context.abrupt("return");
                case 14:
                  if (!(this.env.provider.capability() !== 'SUPPORTED')) {
                    _context.next = 19;
                    break;
                  }
                  this.message = this.blockMessage('AD_UNSUPPORTED');
                  this.phase = 'ERROR';
                  this.changed();
                  return _context.abrupt("return");
                case 19:
                  if (RewardedAdCoordinator.claim('extra-shake')) {
                    _context.next = 24;
                    break;
                  }
                  this.message = '另有广告正在进行，请稍后再试。';
                  this.phase = 'ERROR';
                  this.changed();
                  return _context.abrupt("return");
                case 24:
                  this.busy = true;
                  this.phase = 'PREPARING';
                  this.message = null;
                  this.changed();
                  _context.prev = 28;
                  _context.next = 31;
                  return this.host.waitForSaveIdle();
                case 31:
                  if (!(this.host !== owner || generation !== this.hostGeneration || ((_owner$getActiveRunSn = owner.getActiveRunSnapshot()) == null ? void 0 : _owner$getActiveRunSn.runId) !== run.runId)) {
                    _context.next = 33;
                    break;
                  }
                  throw new Error('REWARD_ATTEMPT_OWNER_CHANGED');
                case 33:
                  bundle = owner.getBundle();
                  run = owner.getActiveRunSnapshot();
                  if (!(!bundle || !run)) {
                    _context.next = 37;
                    break;
                  }
                  throw new Error('REWARD_ATTEMPT_RUN_MISSING');
                case 37:
                  attemptId = makeUuid();
                  pending = {
                    attemptId: attemptId,
                    runId: run.runId,
                    policyVersion: this.env.policy.policyVersion,
                    amount: 1,
                    dayKey: RewardLedger.dayKey(this.now()),
                    startedAt: this.now()
                  };
                  frozen = copy(bundle);
                  frozen.profile.rewardedShake = _extends({}, RewardLedger.normalize(frozen.profile.rewardedShake, pending.dayKey), {
                    pendingAttempt: pending
                  });
                  _context.next = 43;
                  return this.repo.commitBundle(owner.getSaveRevision(), bundle.profile.activeRunId, frozen);
                case 43:
                  pendingCommit = _context.sent;
                  if (!(this.host !== owner || generation !== this.hostGeneration || ((_owner$getActiveRunSn2 = owner.getActiveRunSnapshot()) == null ? void 0 : _owner$getActiveRunSn2.runId) !== run.runId)) {
                    _context.next = 46;
                    break;
                  }
                  throw new Error('REWARD_ATTEMPT_OWNER_CHANGED');
                case 46:
                  if (pendingCommit.ok) {
                    _context.next = 53;
                    break;
                  }
                  this.busy = false;
                  this.phase = 'ERROR';
                  this.retrySettle = false;
                  this.message = '无法写入待确认的广告奖励，广告未展示。';
                  this.changed();
                  return _context.abrupt("return");
                case 53:
                  owner.onRewardedShakeCommitted(frozen, pendingCommit.data.revision);
                  this.pendingAttempt = attemptId;
                  this.trustedCompletionAttempt = null;
                  _context.next = 58;
                  return this.env.provider.prepare();
                case 58:
                  prepared = _context.sent;
                  if (!(this.host !== owner || generation !== this.hostGeneration)) {
                    _context.next = 61;
                    break;
                  }
                  throw new Error('REWARD_ATTEMPT_OWNER_CHANGED');
                case 61:
                  if (prepared.ok) {
                    _context.next = 68;
                    break;
                  }
                  _context.next = 64;
                  return this.clearPending('广告暂时无法加载，未发放奖励。');
                case 64:
                  if (_context.sent) {
                    _context.next = 66;
                    break;
                  }
                  throw new Error('REWARD_PENDING_CLEAR_FAILED');
                case 66:
                  this.busy = false;
                  return _context.abrupt("return");
                case 68:
                  this.phase = 'SHOWING';
                  this.changed();
                  _context.next = 72;
                  return this.env.provider.show(attemptId);
                case 72:
                  outcome = _context.sent;
                  if (!(this.host !== owner || generation !== this.hostGeneration || ((_owner$getActiveRunSn3 = owner.getActiveRunSnapshot()) == null ? void 0 : _owner$getActiveRunSn3.runId) !== run.runId)) {
                    _context.next = 76;
                    break;
                  }
                  this.busy = false;
                  return _context.abrupt("return");
                case 76:
                  if (!(outcome.kind !== 'COMPLETED')) {
                    _context.next = 83;
                    break;
                  }
                  _context.next = 79;
                  return this.clearPending(outcome.kind === 'CANCELLED' ? '观看未完成，未发放奖励。' : '广告播放失败，未发放奖励。');
                case 79:
                  if (_context.sent) {
                    _context.next = 81;
                    break;
                  }
                  throw new Error('REWARD_PENDING_CLEAR_FAILED');
                case 81:
                  this.busy = false;
                  return _context.abrupt("return");
                case 83:
                  this.trustedCompletionAttempt = attemptId;
                  this.phase = 'SETTLING';
                  this.changed();
                  _context.next = 88;
                  return this.settle(attemptId);
                case 88:
                  this.busy = false;
                  _context.next = 94;
                  break;
                case 91:
                  _context.prev = 91;
                  _context.t0 = _context["catch"](28);
                  if (this.host === owner && generation === this.hostGeneration) {
                    this.phase = 'ERROR';
                    this.retrySettle = !!this.pendingAttempt && this.trustedCompletionAttempt === this.pendingAttempt;
                    this.message = '广告流程暂时未完成；存档保持待确认状态，可重试或返回游戏。';
                    this.changed();
                  }
                case 94:
                  _context.prev = 94;
                  if (this.phase !== 'SHOWING') this.busy = false;
                  RewardedAdCoordinator.release('extra-shake');
                  return _context.finish(94);
                case 98:
                case "end":
                  return _context.stop();
              }
            }, _callee, this, [[28, 91, 94, 98]]);
          }));
          function watch() {
            return _watch.apply(this, arguments);
          }
          return watch;
        }();
        _proto.retrySettlement = /*#__PURE__*/function () {
          var _retrySettlement = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2() {
            return _regeneratorRuntime().wrap(function _callee2$(_context2) {
              while (1) switch (_context2.prev = _context2.next) {
                case 0:
                  if (!(!this.host || this.busy || !this.pendingAttempt || this.trustedCompletionAttempt !== this.pendingAttempt)) {
                    _context2.next = 2;
                    break;
                  }
                  return _context2.abrupt("return");
                case 2:
                  this.busy = true;
                  this.phase = 'SETTLING';
                  this.message = null;
                  this.changed();
                  _context2.prev = 6;
                  _context2.next = 9;
                  return this.settle(this.pendingAttempt);
                case 9:
                  _context2.next = 17;
                  break;
                case 11:
                  _context2.prev = 11;
                  _context2.t0 = _context2["catch"](6);
                  this.phase = 'ERROR';
                  this.retrySettle = true;
                  this.message = '奖励保存仍未完成，可稍后重试。';
                  this.changed();
                case 17:
                  _context2.prev = 17;
                  this.busy = false;
                  return _context2.finish(17);
                case 20:
                case "end":
                  return _context2.stop();
              }
            }, _callee2, this, [[6, 11, 17, 20]]);
          }));
          function retrySettlement() {
            return _retrySettlement.apply(this, arguments);
          }
          return retrySettlement;
        }();
        _proto.abandonPending = /*#__PURE__*/function () {
          var _abandonPending = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee3() {
            var cleared;
            return _regeneratorRuntime().wrap(function _callee3$(_context3) {
              while (1) switch (_context3.prev = _context3.next) {
                case 0:
                  if (!(!this.host || this.busy)) {
                    _context3.next = 2;
                    break;
                  }
                  return _context3.abrupt("return");
                case 2:
                  this.busy = true;
                  _context3.next = 5;
                  return this.clearPending('已放弃未确认的广告奖励。');
                case 5:
                  cleared = _context3.sent;
                  if (cleared) {
                    _context3.next = 12;
                    break;
                  }
                  this.busy = false;
                  this.phase = 'ERROR';
                  this.message = '放弃操作未能保存，请重试。';
                  this.changed();
                  return _context3.abrupt("return");
                case 12:
                  this.stalePending = false;
                  this.pendingAttempt = null;
                  this.trustedCompletionAttempt = null;
                  this.retrySettle = false;
                  this.phase = 'IDLE';
                  this.busy = false;
                  this.changed();
                  this.host.resumeFromRewardedAd('已放弃未确认的广告奖励。');
                case 20:
                case "end":
                  return _context3.stop();
              }
            }, _callee3, this);
          }));
          function abandonPending() {
            return _abandonPending.apply(this, arguments);
          }
          return abandonPending;
        }();
        _proto.acknowledgeGrant = function acknowledgeGrant() {
          if (!this.host || this.phase !== 'GRANTED') return;
          this.phase = 'IDLE';
          this.message = null;
          this.changed();
          this.host.resumeFromRewardedAd(null);
        };
        _proto.check = function check() {
          var _this$host$getBundle3, _this$host4, _this$host$getActiveR2, _this$host5, _this$host$isTutorial2, _this$host6;
          var bundle = (_this$host$getBundle3 = (_this$host4 = this.host) == null ? void 0 : _this$host4.getBundle()) != null ? _this$host$getBundle3 : null;
          var run = (_this$host$getActiveR2 = (_this$host5 = this.host) == null ? void 0 : _this$host5.getActiveRunSnapshot()) != null ? _this$host$getActiveR2 : null;
          if (!bundle || !run) return {
            allowed: false,
            block: 'NO_ACTIVE_RUN'
          };
          return RewardLedger.checkOffer({
            policy: this.env.policy,
            capability: this.env.provider.capability(),
            profile: bundle.profile,
            run: run,
            foregroundSeconds: this.foregroundSeconds,
            tutorialComplete: (_this$host$isTutorial2 = (_this$host6 = this.host) == null ? void 0 : _this$host6.isTutorialComplete()) != null ? _this$host$isTutorial2 : false,
            nowMs: this.now()
          });
        };
        _proto.clearPending = /*#__PURE__*/function () {
          var _clearPending = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee4(message) {
            var owner, generation, bundle, next, committed;
            return _regeneratorRuntime().wrap(function _callee4$(_context4) {
              while (1) switch (_context4.prev = _context4.next) {
                case 0:
                  owner = this.host, generation = this.hostGeneration;
                  if (owner) {
                    _context4.next = 3;
                    break;
                  }
                  return _context4.abrupt("return", false);
                case 3:
                  bundle = owner.getBundle();
                  if (!bundle) {
                    _context4.next = 13;
                    break;
                  }
                  next = copy(bundle);
                  next.profile.rewardedShake = RewardLedger.clearPending(next.profile.rewardedShake);
                  _context4.next = 9;
                  return this.repo.commitBundle(owner.getSaveRevision(), bundle.profile.activeRunId, next);
                case 9:
                  committed = _context4.sent;
                  if (!(this.host !== owner || generation !== this.hostGeneration || !committed.ok)) {
                    _context4.next = 12;
                    break;
                  }
                  return _context4.abrupt("return", false);
                case 12:
                  owner.onRewardedShakeCommitted(next, committed.data.revision);
                case 13:
                  this.pendingAttempt = null;
                  this.phase = 'ERROR';
                  this.retrySettle = false;
                  this.message = message;
                  this.changed();
                  this.trustedCompletionAttempt = null;
                  owner.resumeFromRewardedAd(message);
                  return _context4.abrupt("return", true);
                case 21:
                case "end":
                  return _context4.stop();
              }
            }, _callee4, this);
          }));
          function clearPending(_x) {
            return _clearPending.apply(this, arguments);
          }
          return clearPending;
        }();
        _proto.settle = /*#__PURE__*/function () {
          var _settle = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee5(attemptId) {
            var _owner$getActiveRunSn4, _ledger$pendingAttemp, _owner$getActiveRunSn5, _persistedBundle$run;
            var owner, generation, bundle, run, ledger, receipt, persisted, pending, sameDay, nextLedger, projectedRun, next, committed, readback, persistedBundle;
            return _regeneratorRuntime().wrap(function _callee5$(_context5) {
              while (1) switch (_context5.prev = _context5.next) {
                case 0:
                  owner = this.host, generation = this.hostGeneration;
                  if (owner) {
                    _context5.next = 3;
                    break;
                  }
                  return _context5.abrupt("return");
                case 3:
                  bundle = owner.getBundle();
                  run = owner.getActiveRunSnapshot();
                  if (!(!bundle || !run)) {
                    _context5.next = 7;
                    break;
                  }
                  return _context5.abrupt("return");
                case 7:
                  _context5.next = 9;
                  return owner.waitForSaveIdle();
                case 9:
                  if (!(this.host !== owner || generation !== this.hostGeneration || ((_owner$getActiveRunSn4 = owner.getActiveRunSnapshot()) == null ? void 0 : _owner$getActiveRunSn4.runId) !== run.runId)) {
                    _context5.next = 11;
                    break;
                  }
                  return _context5.abrupt("return");
                case 11:
                  bundle = owner.getBundle();
                  if (bundle) {
                    _context5.next = 14;
                    break;
                  }
                  return _context5.abrupt("return");
                case 14:
                  ledger = bundle.profile.rewardedShake;
                  if (!RewardLedger.hasReceipt(ledger, attemptId)) {
                    _context5.next = 31;
                    break;
                  }
                  // Crash after commit before applying to the live engine: repair the in-memory grant once.
                  receipt = ledger.receipts.find(function (item) {
                    return item.attemptId === attemptId;
                  });
                  persisted = bundle.run;
                  if (!(!receipt || receipt.runId !== run.runId || !persisted || persisted.runId !== run.runId || persisted.shake.extraGranted < run.shake.extraGranted)) {
                    _context5.next = 24;
                    break;
                  }
                  this.phase = 'ERROR';
                  this.retrySettle = false;
                  this.message = '奖励凭证与当前局不匹配，未应用。';
                  this.changed();
                  return _context5.abrupt("return");
                case 24:
                  if (persisted.shake.extraGranted > run.shake.extraGranted) owner.applyCommittedExtraGrant();
                  this.phase = 'GRANTED';
                  this.message = null;
                  this.retrySettle = false;
                  this.pendingAttempt = null;
                  this.changed();
                  return _context5.abrupt("return");
                case 31:
                  if (!(((_ledger$pendingAttemp = ledger.pendingAttempt) == null ? void 0 : _ledger$pendingAttemp.attemptId) !== attemptId || ledger.pendingAttempt.runId !== run.runId)) {
                    _context5.next = 37;
                    break;
                  }
                  this.phase = 'ERROR';
                  this.retrySettle = false;
                  this.message = '找不到本局待确认的广告奖励记录，未发放。';
                  this.changed();
                  return _context5.abrupt("return");
                case 37:
                  if (!(run.shake.extraGranted + 1 > this.env.policy.maxExtraShakesPerRun)) {
                    _context5.next = 43;
                    break;
                  }
                  this.phase = 'ERROR';
                  this.retrySettle = false;
                  this.message = '本局奖励晃杯已达上限，未发放。';
                  this.changed();
                  return _context5.abrupt("return");
                case 43:
                  pending = ledger.pendingAttempt;
                  sameDay = RewardLedger.normalize(ledger, pending.dayKey);
                  if (!(this.env.policy.maxDailyRewardedShakes - sameDay.dailyGranted < 1)) {
                    _context5.next = 51;
                    break;
                  }
                  this.phase = 'ERROR';
                  this.retrySettle = false;
                  this.message = '今日广告奖励已达上限，未发放。';
                  this.changed();
                  return _context5.abrupt("return");
                case 51:
                  nextLedger = RewardLedger.grant(ledger, RewardLedger.receiptFor(pending, this.now()), run.runId);
                  projectedRun = copy(run);
                  projectedRun.shake = _extends({}, projectedRun.shake, {
                    extraGranted: projectedRun.shake.extraGranted + 1,
                    extraUsed: projectedRun.shake.extraUsed
                  });
                  projectedRun.revision += 1;
                  next = copy(bundle);
                  next.profile.rewardedShake = nextLedger;
                  next.run = projectedRun;
                  _context5.next = 60;
                  return this.repo.commitBundle(owner.getSaveRevision(), run.runId, next);
                case 60:
                  committed = _context5.sent;
                  if (!(this.host !== owner || generation !== this.hostGeneration || ((_owner$getActiveRunSn5 = owner.getActiveRunSnapshot()) == null ? void 0 : _owner$getActiveRunSn5.runId) !== run.runId)) {
                    _context5.next = 63;
                    break;
                  }
                  return _context5.abrupt("return");
                case 63:
                  if (committed.ok) {
                    _context5.next = 69;
                    break;
                  }
                  this.phase = 'ERROR';
                  this.retrySettle = true;
                  this.message = '广告已完成，但奖励保存失败；请在稍后重试领取。';
                  this.changed();
                  return _context5.abrupt("return");
                case 69:
                  _context5.next = 71;
                  return this.repo.readBundle();
                case 71:
                  readback = _context5.sent;
                  if (!(this.host !== owner || generation !== this.hostGeneration)) {
                    _context5.next = 74;
                    break;
                  }
                  return _context5.abrupt("return");
                case 74:
                  if (!(!readback.ok || !readback.data.envelope || !RewardLedger.hasReceipt(readback.data.envelope.payload.profile.rewardedShake, attemptId))) {
                    _context5.next = 80;
                    break;
                  }
                  this.phase = 'ERROR';
                  this.retrySettle = true;
                  this.message = '奖励已提交但回读未确认，可重试领取。';
                  this.changed();
                  return _context5.abrupt("return");
                case 80:
                  persistedBundle = readback.data.envelope.payload;
                  if (!(((_persistedBundle$run = persistedBundle.run) == null ? void 0 : _persistedBundle$run.runId) !== run.runId || persistedBundle.run.shake.extraGranted < run.shake.extraGranted + 1)) {
                    _context5.next = 87;
                    break;
                  }
                  this.phase = 'ERROR';
                  this.retrySettle = true;
                  this.message = '奖励账本与本局额度未能一致回读，可重试领取。';
                  this.changed();
                  return _context5.abrupt("return");
                case 87:
                  owner.onRewardedShakeCommitted(persistedBundle, committed.data.revision);
                  owner.applyCommittedExtraGrant();
                  this.pendingAttempt = null;
                  this.stalePending = false;
                  this.phase = 'GRANTED';
                  this.message = null;
                  this.retrySettle = false;
                  this.changed();
                case 95:
                case "end":
                  return _context5.stop();
              }
            }, _callee5, this);
          }));
          function settle(_x2) {
            return _settle.apply(this, arguments);
          }
          return settle;
        }();
        _proto.changed = function changed() {
          var _this$host7;
          (_this$host7 = this.host) == null || _this$host7.onRewardedShakeChanged();
        };
        _proto.blockMessage = function blockMessage(block) {
          switch (block) {
            case 'POLICY_DISABLED':
              return '广告奖励尚未开启';
            case 'AD_UNCONFIGURED':
              return '未配置真实广告位';
            case 'AD_UNSUPPORTED':
              return '当前环境不支持激励广告';
            case 'NO_ACTIVE_RUN':
            case 'NOT_PLAYING':
              return '当前局不可用';
            case 'BASE_SHAKES_REMAINING':
              return '还有基础晃杯次数';
            case 'RUN_LIMIT':
              return '本局奖励晃杯已达上限';
            case 'DAILY_LIMIT':
              return '今日广告奖励已达上限';
            case 'TUTORIAL_REQUIRED':
              return '完成教程后可观看广告';
            case 'FIRST_RUN_REQUIRED':
              return '完成一局真实游戏后可观看广告';
            case 'FOREGROUND_REQUIRED':
              return '游戏时间稍短，暂不可观看广告';
            case 'PENDING_ATTEMPT':
              return '有未确认的广告奖励';
            default:
              return '暂不可观看广告';
          }
        };
        _createClass(RewardedShakeService, [{
          key: "policy",
          get: function get() {
            return this.env.policy;
          }
        }]);
        return RewardedShakeService;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/RewardLedger.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
  var _extends, cclegacy;
  return {
    setters: [function (module) {
      _extends = module.extends;
    }, function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      cclegacy._RF.push({}, "bc8e8B7OXFBFawkFNqQ81kb", "RewardLedger", undefined);
      /** Deterministic day/quota rules shared by the service and the automated acceptance tests. */
      var RewardLedger = exports('RewardLedger', /*#__PURE__*/function () {
        function RewardLedger() {}
        /** Asia/Shanghai has no DST; a fixed +08:00 offset keeps the day key stable across devices. */
        RewardLedger.dayKey = function dayKey(nowMs) {
          return new Date(nowMs + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
        };
        RewardLedger.normalize = function normalize(ledger, today) {
          if (ledger.dayKey === today) return ledger;
          return _extends({}, ledger, {
            dayKey: today,
            dailyGranted: this.grantedForDay(ledger, today)
          });
        };
        RewardLedger.grantedForDay = function grantedForDay(ledger, day) {
          var receipts = ledger.receipts.filter(function (receipt) {
            return receipt.dayKey === day;
          }).length;
          return Math.max(ledger.dayKey === day ? ledger.dailyGranted : 0, receipts);
        };
        RewardLedger.dailyRemaining = function dailyRemaining(ledger, policy, today) {
          return Math.max(0, policy.maxDailyRewardedShakes - this.grantedForDay(ledger, today));
        };
        RewardLedger.pendingForRun = function pendingForRun(ledger, runId) {
          var _ledger$pendingAttemp;
          return runId && ((_ledger$pendingAttemp = ledger.pendingAttempt) == null ? void 0 : _ledger$pendingAttemp.runId) === runId ? ledger.pendingAttempt : null;
        };
        RewardLedger.hasReceipt = function hasReceipt(ledger, attemptId) {
          return ledger.receipts.some(function (receipt) {
            return receipt.attemptId === attemptId;
          });
        };
        RewardLedger.checkOffer = function checkOffer(input) {
          var policy = input.policy,
            capability = input.capability,
            profile = input.profile,
            run = input.run,
            foregroundSeconds = input.foregroundSeconds,
            tutorialComplete = input.tutorialComplete,
            nowMs = input.nowMs;
          if (!policy.enabled) return {
            allowed: false,
            block: 'POLICY_DISABLED'
          };
          if (capability === 'UNCONFIGURED') return {
            allowed: false,
            block: 'AD_UNCONFIGURED'
          };
          if (capability !== 'SUPPORTED') return {
            allowed: false,
            block: 'AD_UNSUPPORTED'
          };
          if (!run || run.state !== 'PLAYING' && run.state !== 'PAUSED') return {
            allowed: false,
            block: 'NO_ACTIVE_RUN'
          };
          if (run.shake.baseUsed < 2) return {
            allowed: false,
            block: 'BASE_SHAKES_REMAINING'
          };
          if (run.shake.extraGranted >= policy.maxExtraShakesPerRun) return {
            allowed: false,
            block: 'RUN_LIMIT'
          };
          var today = this.dayKey(nowMs);
          if (this.dailyRemaining(profile.rewardedShake, policy, today) < 1) return {
            allowed: false,
            block: 'DAILY_LIMIT'
          };
          if (policy.requireTutorialComplete && !tutorialComplete) return {
            allowed: false,
            block: 'TUTORIAL_REQUIRED'
          };
          if (policy.requireFirstNaturalRunCompleted && !profile.firstNaturalRunCompleted) return {
            allowed: false,
            block: 'FIRST_RUN_REQUIRED'
          };
          if (!(foregroundSeconds >= policy.minForegroundSecondsFirstSession)) return {
            allowed: false,
            block: 'FOREGROUND_REQUIRED'
          };
          if (this.pendingForRun(profile.rewardedShake, run.runId)) return {
            allowed: false,
            block: 'PENDING_ATTEMPT'
          };
          return {
            allowed: true,
            block: null
          };
        };
        RewardLedger.receiptFor = function receiptFor(pending, nowMs) {
          return {
            attemptId: pending.attemptId,
            runId: pending.runId,
            rewardKind: 'extra_shake',
            amount: 1,
            policyVersion: pending.policyVersion,
            dayKey: pending.dayKey,
            status: 'COMMITTED',
            grantedAt: nowMs
          };
        };
        RewardLedger.grant = function grant(ledger, receipt, activeRunId) {
          var existing = ledger.receipts.find(function (item) {
            return item.attemptId === receipt.attemptId;
          });
          if (existing) {
            if (existing.runId !== receipt.runId || existing.rewardKind !== receipt.rewardKind || existing.amount !== receipt.amount || existing.policyVersion !== receipt.policyVersion || existing.dayKey !== receipt.dayKey) throw new Error('REWARD_RECEIPT_CONFLICT');
            return ledger;
          }
          var receipts = this.prune([].concat(ledger.receipts, [receipt]), receipt.dayKey, activeRunId);
          var priorCount = this.grantedForDay(ledger, receipt.dayKey),
            priorReceiptCount = ledger.receipts.filter(function (item) {
              return item.dayKey === receipt.dayKey;
            }).length;
          var countForReceiptDay = priorCount > priorReceiptCount ? priorCount + 1 : receipts.filter(function (item) {
            return item.dayKey === receipt.dayKey;
          }).length;
          var keepCurrentDay = !!ledger.dayKey && ledger.dayKey > receipt.dayKey;
          return {
            dayKey: keepCurrentDay ? ledger.dayKey : receipt.dayKey,
            dailyGranted: keepCurrentDay ? ledger.dailyGranted : countForReceiptDay,
            pendingAttempt: null,
            receipts: receipts
          };
        };
        RewardLedger.clearPending = function clearPending(ledger) {
          return _extends({}, ledger, {
            pendingAttempt: null
          });
        };
        RewardLedger.prune = function prune(receipts, keepDayKey, activeRunId) {
          var floor = new Date(keepDayKey + "T00:00:00Z").getTime() - 6 * 24 * 60 * 60 * 1000;
          return receipts.filter(function (receipt) {
            return receipt.runId === activeRunId || new Date(receipt.dayKey + "T00:00:00Z").getTime() >= floor;
          }).slice(-64);
        };
        return RewardLedger;
      }());
      RewardLedger.EMPTY = {
        dayKey: null,
        dailyGranted: 0,
        pendingAttempt: null,
        receipts: []
      };
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/RunEngine.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './CloneState.ts', './RunRng.ts', './SpawnRng.ts', './EventIdentity.ts', './Sha256.ts'], function (exports) {
  var _extends, _createForOfIteratorHelperLoose, _createClass, cclegacy, cloneState, RunRng, SpawnRng, deterministicEventId, sha256Utf8;
  return {
    setters: [function (module) {
      _extends = module.extends;
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
      _createClass = module.createClass;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      cloneState = module.cloneState;
    }, function (module) {
      RunRng = module.RunRng;
    }, function (module) {
      SpawnRng = module.SpawnRng;
    }, function (module) {
      deterministicEventId = module.deterministicEventId;
    }, function (module) {
      sha256Utf8 = module.sha256Utf8;
    }],
    execute: function () {
      cclegacy._RF.push({}, "376dcscl4dLYLW/kfsbUVek", "RunEngine", undefined);
      var REVIVE_OFF = Object.freeze({
        enabled: false,
        clearanceDu: 0,
        autoDropDelayTicks: 0
      });
      var success = function success(data) {
        return {
          ok: true,
          data: data
        };
      };
      var failure = function failure(code, message, retryable) {
        if (retryable === void 0) {
          retryable = false;
        }
        return {
          ok: false,
          error: {
            code: code,
            message: message,
            retryable: retryable
          }
        };
      };
      var UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      /** Single writer for P1-B run state. It advances only when the owning FixedClock calls advanceOneTick. */
      var RunEngine = exports('RunEngine', /*#__PURE__*/function () {
        function RunEngine(adapter, rules, runId, seed, restored, reviveOptions) {
          var _restored$rng$drawCou, _restored$spawnRng, _restored$spawnRng$dr, _restored$spawnRng2;
          if (reviveOptions === void 0) {
            reviveOptions = REVIVE_OFF;
          }
          this.state = void 0;
          this.rng = void 0;
          this.spawnRng = void 0;
          this.pending = null;
          this.outcomes = new Map();
          this.usedMergeEvents = new Set();
          this.lastCommandOutcome = null;
          this.ended = false;
          this.shakenAt = [];
          this._lastPhysicsMs = 0;
          this._lastLogicMs = 0;
          this._lastTickFault = null;
          this._recoveryCheckpoint = null;
          this.timingDiagnostics = false;
          this.settleTicksRemaining = 0;
          this.adapter = adapter;
          this.rules = rules;
          this.reviveOptions = reviveOptions;
          this.rng = new RunRng(seed, restored == null ? void 0 : restored.rng.state, (_restored$rng$drawCou = restored == null ? void 0 : restored.rng.drawCount) != null ? _restored$rng$drawCou : 0);
          this.spawnRng = new SpawnRng(seed, restored == null || (_restored$spawnRng = restored.spawnRng) == null ? void 0 : _restored$spawnRng.state, (_restored$spawnRng$dr = restored == null || (_restored$spawnRng2 = restored.spawnRng) == null ? void 0 : _restored$spawnRng2.drawCount) != null ? _restored$spawnRng$dr : 0);
          var initialLevel = restored == null ? void 0 : restored.currentLevel;
          this.state = restored ? cloneState(restored) : {
            saveSchemaVersion: 5,
            rulesVersion: rules.design_rules_version,
            appVersion: '0.1.0',
            runId: runId,
            epoch: 1,
            revision: 0,
            stageId: 'classic',
            mode: 'classic',
            boardType: 'standard',
            state: 'PLAYING',
            tick: 0,
            nextEntityId: 1,
            nextCommandSequence: 1,
            score: 0,
            maxLevel: 1,
            dropIndex: 0,
            currentLevel: this.rng.nextLevel(rules.drop.spawn_levels),
            nextLevel: this.rng.nextLevel(rules.drop.spawn_levels),
            lastDropTick: null,
            settleStartedTick: null,
            challenge: null,
            rng: this.rng.snapshot(),
            ingredients: [],
            shake: {
              baseUsed: 0,
              extraGranted: 0,
              extraUsed: 0,
              activeStartTick: null,
              cooldownUntilTick: 0
            },
            spawnRng: this.spawnRng.snapshot(),
            dangerTicks: 0,
            terminalReason: null,
            cupMotion: {
              offsetXDu: 0,
              velocityXDuPerSecond: 0,
              targetOffsetXDu: 0,
              control: 'IDLE'
            },
            autoDrop: {
              nextDueTick: rules.auto_drop.interval_ticks,
              pendingSpawn: {
                level: initialLevel != null ? initialLevel : 1,
                xDu: rules.cup.center_x_du,
                vxDuPerSecond: 0,
                angularVelocity: 0
              }
            },
            revive: {
              used: 0,
              pendingFailure: null,
              committedReceiptId: null
            },
            checksum: ''
          };
          if (!restored) this.state.autoDrop.pendingSpawn = this.nextSpawn(this.state.currentLevel);
          if (restored) {
            var _restored$cupMotion$o, _restored$cupMotion, _restored$cupMotion$o2, _restored$cupMotion2, _restored$cupMotion$o3, _restored$cupMotion3;
            this.rng = new RunRng(seed, restored.rng.state, restored.rng.drawCount);
            this.adapter.createCup(restored.stageId, (_restored$cupMotion$o = (_restored$cupMotion = restored.cupMotion) == null ? void 0 : _restored$cupMotion.offsetXDu) != null ? _restored$cupMotion$o : 0);
            this.adapter.restoreBodies(restored.ingredients);
            this.state.state = 'PAUSED';
            this.state.cupMotion = {
              offsetXDu: (_restored$cupMotion$o2 = (_restored$cupMotion2 = restored.cupMotion) == null ? void 0 : _restored$cupMotion2.offsetXDu) != null ? _restored$cupMotion$o2 : 0,
              velocityXDuPerSecond: 0,
              targetOffsetXDu: (_restored$cupMotion$o3 = (_restored$cupMotion3 = restored.cupMotion) == null ? void 0 : _restored$cupMotion3.offsetXDu) != null ? _restored$cupMotion$o3 : 0,
              control: 'IDLE'
            };
            this.state.epoch++;
          }
        }
        var _proto = RunEngine.prototype;
        /** Snapshot of the cleaned run after revive, used by the host to persist the reward atomically before applying it. */
        _proto.projectRevive = function projectRevive(receiptId) {
          var pending = this.state.revive.pendingFailure;
          if (!pending) return failure('NO_SPILL_PENDING', '当前没有待处理的洒出复活');
          if (!UUID_PATTERN.test(receiptId)) return failure('INVALID_RECEIPT', '复活奖励凭证无效');
          if (this.state.revive.used !== 0) return failure('REVIVE_ALREADY_USED', '本局复活次数已用完');
          var candidate = this.computeSpillCandidate(pending.detectedTick, pending.spilledEntityIds);
          if (candidate.candidateHash !== pending.candidateHash) return failure('REVIVE_CANDIDATE_MISMATCH', '复活候选与冻结现场不一致');
          if (candidate.ingredients.length === 0) return failure('REVIVE_EMPTY', '清理后杯中没有可继续的小料');
          var projected = cloneState(this.state);
          projected.ingredients = candidate.ingredients;
          projected.score = candidate.score;
          projected.maxLevel = candidate.maxLevel;
          projected.dropIndex = candidate.dropIndex;
          projected.currentLevel = candidate.currentLevel;
          projected.nextLevel = candidate.nextLevel;
          projected.nextEntityId = candidate.nextEntityId;
          projected.dangerTicks = candidate.dangerTicks;
          projected.shake = _extends({}, candidate.shake);
          projected.cupMotion = {
            offsetXDu: 0,
            velocityXDuPerSecond: 0,
            targetOffsetXDu: 0,
            control: 'IDLE'
          };
          projected.autoDrop = {
            nextDueTick: projected.tick + Math.max(0, this.reviveOptions.autoDropDelayTicks),
            pendingSpawn: _extends({}, candidate.autoDrop.pendingSpawn)
          };
          projected.revive = {
            used: 1,
            pendingFailure: null,
            committedReceiptId: receiptId
          };
          projected.boardType = 'assisted';
          projected.state = 'PAUSED';
          projected.terminalReason = null;
          projected.rng = this.rng.snapshot();
          projected.spawnRng = this.spawnRng.snapshot();
          projected.revision += 1;
          projected.epoch += 1;
          projected.checksum = '';
          return success(projected);
        }
        /** Deterministic cleanup projection for the frozen spill step; rebuilt from the paused snapshot and config. */;
        _proto.spillCandidate = function spillCandidate() {
          var pending = this.state.revive.pendingFailure;
          return pending ? this.computeSpillCandidate(pending.detectedTick, pending.spilledEntityIds) : null;
        }
        /** Claim the once-per-run revive after the host persisted the reward receipt. */;
        _proto.applyRevive = function applyRevive(receiptId) {
          var pending = this.state.revive.pendingFailure;
          if (!pending) return failure('NO_SPILL_PENDING', '当前没有待处理的洒出复活');
          if (this.state.state !== 'PAUSED' || this.ended) return failure('INVALID_PHASE', '当前局不接受复活');
          if (this.state.revive.used !== 0) return failure('REVIVE_ALREADY_USED', '本局复活次数已用完');
          if (typeof receiptId !== 'string' || !UUID_PATTERN.test(receiptId)) return failure('INVALID_RECEIPT', '复活奖励凭证无效');
          var candidate = this.computeSpillCandidate(pending.detectedTick, pending.spilledEntityIds);
          if (candidate.candidateHash !== pending.candidateHash) return failure('REVIVE_CANDIDATE_MISMATCH', '复活候选与冻结现场不一致');
          if (candidate.ingredients.length === 0) return failure('REVIVE_EMPTY', '清理后杯中没有可继续的小料');
          for (var _iterator = _createForOfIteratorHelperLoose(candidate.removedEntityIds), _step; !(_step = _iterator()).done;) {
            var entityId = _step.value;
            try {
              if (this.adapter.getBody(entityId)) this.adapter.destroyBody(entityId);
            } catch (_unused) {/* missing body is already clean */}
          }
          this.adapter.createCup(this.state.stageId, candidate.cupOffsetXDu);
          this.adapter.setCupVelocityX(0);
          this.adapter.restoreBodies(candidate.ingredients);
          this.state.ingredients = candidate.ingredients;
          this.state.score = candidate.score;
          this.state.maxLevel = candidate.maxLevel;
          this.state.dropIndex = candidate.dropIndex;
          this.state.currentLevel = candidate.currentLevel;
          this.state.nextLevel = candidate.nextLevel;
          this.state.nextEntityId = candidate.nextEntityId;
          this.state.dangerTicks = candidate.dangerTicks;
          this.state.shake = _extends({}, candidate.shake);
          this.state.cupMotion = {
            offsetXDu: candidate.cupOffsetXDu,
            velocityXDuPerSecond: 0,
            targetOffsetXDu: candidate.cupOffsetXDu,
            control: 'IDLE'
          };
          this.state.autoDrop = {
            nextDueTick: this.state.tick + Math.max(0, this.reviveOptions.autoDropDelayTicks),
            pendingSpawn: _extends({}, candidate.autoDrop.pendingSpawn)
          };
          this.state.revive = {
            used: 1,
            pendingFailure: null,
            committedReceiptId: receiptId
          };
          this.state.boardType = 'assisted';
          this.state.state = 'PAUSED';
          this.state.terminalReason = null;
          this.state.epoch++;
          this.state.revision++;
          this.shakenAt = [];
          this._recoveryCheckpoint = null;
          return success(undefined);
        }
        /** Player declined or the ad did not complete: preserve the frozen result and settle the spill. */;
        _proto.declineRevive = function declineRevive() {
          if (!this.state.revive.pendingFailure) return null;
          this.state.revive.pendingFailure = null;
          return this.end('SPILLED', this.state.tick);
        };
        _proto.setTimingDiagnostics = function setTimingDiagnostics(enabled) {
          this.timingDiagnostics = enabled;
        };
        _proto.setCupTarget = function setCupTarget(offsetXDu) {
          if (this.state.state !== 'PLAYING' || !Number.isFinite(offsetXDu)) return;
          var max = this.rules.cup_motion.max_offset_du;
          this.state.cupMotion.targetOffsetXDu = Math.max(-max, Math.min(max, offsetXDu));
          this.state.cupMotion.control = 'DRAGGING';
        };
        _proto.releaseCup = function releaseCup() {
          if (this.state.cupMotion.control === 'DRAGGING') {
            this.state.cupMotion.control = 'SETTLING';
            this.settleTicksRemaining = this.rules.cup_motion.settle_max_ticks;
          }
        }
        /** Ad reward is granted only after the coordinator persisted the projected snapshot. */;
        _proto.extraShakesAvailable = function extraShakesAvailable() {
          return Math.max(0, this.state.shake.extraGranted - this.state.shake.extraUsed);
        };
        _proto.projectExtraGrant = function projectExtraGrant(amount) {
          var snapshot = this.snapshot();
          snapshot.shake = _extends({}, snapshot.shake, {
            extraGranted: snapshot.shake.extraGranted + amount
          });
          snapshot.revision += 1;
          return snapshot;
        };
        _proto.commitExtraGrant = function commitExtraGrant(amount) {
          if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 5) return failure('INVALID_GRANT', '奖励晃杯授予数量无效');
          if (this.state.state !== 'PLAYING' && this.state.state !== 'PAUSED') return failure('INVALID_PHASE', '当前局不接受奖励晃杯');
          this.state.shake.extraGranted += amount;
          this.state.revision++;
          return success(undefined);
        };
        _proto.cancelCupInput = function cancelCupInput(freeze) {
          this.state.cupMotion.control = 'IDLE';
          this.settleTicksRemaining = 0;
          this.state.cupMotion.velocityXDuPerSecond = 0;
          this.state.cupMotion.targetOffsetXDu = this.adapter.getCupOffsetX();
          this.adapter.setCupVelocityX(0);
        };
        _proto.renderStates = function renderStates() {
          this.refreshPhysicalStates();
          return this.state.ingredients;
        };
        _proto.dispatch = function dispatch(envelope) {
          var _previous$errorCode, _previous$message;
          if (!envelope || typeof envelope !== 'object' || !envelope.command || typeof envelope.command !== 'object' || !Number.isSafeInteger(envelope.ownerEpoch) || Object.keys(envelope).some(function (k) {
            return k !== 'command' && k !== 'ownerEpoch';
          })) return failure('INVALID_COMMAND', '命令信封字段无效');
          var command = envelope.command;
          if (!command || typeof command !== 'object') return failure('INVALID_COMMAND', '命令结构无效');
          if (typeof command.commandId !== 'string' || typeof command.runId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(command.commandId) || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(command.runId)) return failure('INVALID_UUID', '局ID和命令ID必须是合法UUID');
          if (command.kind !== 'DROP' && command.kind !== 'SHAKE') return failure('CONTROL_ROUTE_REQUIRED', '暂停、继续和放弃必须经会话控制边界');
          var commandKeys = command.kind === 'DROP' ? ['kind', 'runId', 'commandId', 'sequence', 'tick', 'xDu'] : ['kind', 'runId', 'commandId', 'sequence', 'tick', 'source'];
          if (Object.keys(command).some(function (k) {
            return !commandKeys.includes(k);
          }) || commandKeys.some(function (k) {
            return !(k in command);
          })) return failure('INVALID_COMMAND', '玩法命令字段不符合其类型');
          if (command.kind === 'DROP') return failure('MANUAL_DROP_DISABLED', '新版规则只按固定步自动落料');
          if (command.kind === 'SHAKE' && command.source !== 'base' && command.source !== 'rewarded_ad') return failure('INVALID_COMMAND', '当前玩法只接受基础晃杯或广告奖励晃杯命令');
          if (this.state.state !== 'PLAYING' || this.ended) return failure('INVALID_PHASE', '当前局不接受玩法命令');
          var previous = this.outcomes.get(command.commandId);
          if (previous) return previous.status === 'APPLIED' ? success({
            accepted: true,
            sequence: previous.sequence
          }) : failure((_previous$errorCode = previous.errorCode) != null ? _previous$errorCode : 'COMMAND_REPLAY', (_previous$message = previous.message) != null ? _previous$message : '此命令已处理');
          if (command.runId !== this.state.runId || envelope.ownerEpoch !== this.state.epoch) return failure('STALE_OWNER', '局或恢复代次已变化');
          if (!Number.isSafeInteger(command.sequence) || command.sequence !== this.state.nextCommandSequence) return failure('SEQUENCE_CONFLICT', '命令序号冲突');
          var expectedTick = this.state.tick + 1;
          if (!Number.isSafeInteger(command.tick) || command.tick !== expectedTick) return failure('TARGET_TICK_CONFLICT', '玩法命令目标必须是下一逻辑步');
          if (this.pending) return failure('INPUT_BUSY', '上一条操作尚未确认', true);
          this.pending = {
            envelope: envelope,
            dispatchedAt: this.state.tick
          };
          return success({
            accepted: true,
            sequence: command.sequence
          });
        };
        _proto.advanceOneTick = function advanceOneTick() {
          if (this.state.state !== 'PLAYING' || this.ended) return [];
          var logicStart = this.timingDiagnostics ? performance.now() : 0;
          var checkpoint = this.snapshot();
          var pendingBefore = this.pending ? cloneState(this.pending) : null;
          var outcomesBefore = new Map(this.outcomes);
          var mergeEventsBefore = new Set(this.usedMergeEvents);
          var lastOutcomeBefore = this.lastCommandOutcome ? _extends({}, this.lastCommandOutcome) : null;
          var events = [];
          var nextTick = this.state.tick + 1;
          if (!Number.isSafeInteger(nextTick)) throw new Error('RUN_TICK_OVERFLOW');
          try {
            this.advanceCupMotion();
            if (this.pending) this.consumePending(nextTick, events);
            this.applyShake(nextTick);
            this.tryAutomaticDrop(nextTick, events);
            var physicsStart = this.timingDiagnostics ? performance.now() : 0;
            this.adapter.stepFixed();
            var reported = this.adapter.lastStepTimings;
            this._lastPhysicsMs = !this.timingDiagnostics ? 0 : reported ? reported.syncToPhysics + reported.physicsStep + reported.syncFromPhysics + reported.velocityClamp : performance.now() - physicsStart;
            this.refreshPhysicalStates();
            var maxCupOffset = this.rules.cup_motion.max_offset_du;
            this.state.cupMotion.offsetXDu = Math.max(-maxCupOffset, Math.min(maxCupOffset, this.adapter.getCupOffsetX()));
            var contacts = this.adapter.getContacts();
            for (var _iterator2 = _createForOfIteratorHelperLoose(contacts), _step2; !(_step2 = _iterator2()).done;) {
              var contact = _step2.value;
              this.markEligible(contact.firstId);
              if (contact.secondId !== null) this.markEligible(contact.secondId);
            }
            this.resolveMerges(nextTick, contacts, events);
            var cupFull = this.updateDanger(nextTick, events);
            var spilledIds = this.updateSpill(nextTick);
            if (spilledIds.length) {
              if (this.beginSpillPending(nextTick, spilledIds)) events.push({
                kind: 'SpillReviveOffered',
                eventId: deterministicEventId(this.state.runId, 'SpillReviveOffered', nextTick, spilledIds),
                runId: this.state.runId,
                tick: nextTick,
                failureId: this.state.revive.pendingFailure.failureId,
                candidateHash: this.state.revive.pendingFailure.candidateHash
              });else events.push(this.end('SPILLED', nextTick));
            } else if (cupFull) events.push(this.end('CUP_FULL', nextTick));
            this.state.tick = nextTick;
            this.state.rng = this.rng.snapshot();
            this.state.revision++;
            this.assertInvariants();
            this._lastLogicMs = this.timingDiagnostics ? Math.max(0, performance.now() - logicStart - this._lastPhysicsMs) : 0;
            this._lastTickFault = null;
            return events;
          } catch (error) {
            this._recoveryCheckpoint = cloneState(checkpoint);
            this.spawnRng = new SpawnRng(checkpoint.spawnRng.state, checkpoint.spawnRng.state, checkpoint.spawnRng.drawCount);
            var fault = error instanceof Error ? error.name + ":" + error.message : String(error);
            var rollbackFault = null;
            try {
              this.adapter.createCup(checkpoint.stageId, checkpoint.cupMotion.offsetXDu);
              this.adapter.setCupVelocityX(checkpoint.cupMotion.velocityXDuPerSecond);
              this.adapter.restoreBodies(checkpoint.ingredients);
            } catch (rollbackError) {
              rollbackFault = rollbackError instanceof Error ? rollbackError.name + ":" + rollbackError.message : String(rollbackError);
            }
            this.state = checkpoint;
            this.rng = new RunRng(checkpoint.rng.state, checkpoint.rng.state, checkpoint.rng.drawCount);
            this.pending = pendingBefore;
            this.outcomes.clear();
            for (var _iterator3 = _createForOfIteratorHelperLoose(outcomesBefore), _step3; !(_step3 = _iterator3()).done;) {
              var _step3$value = _step3.value,
                id = _step3$value[0],
                outcome = _step3$value[1];
              this.outcomes.set(id, outcome);
            }
            this.usedMergeEvents.clear();
            for (var _iterator4 = _createForOfIteratorHelperLoose(mergeEventsBefore), _step4; !(_step4 = _iterator4()).done;) {
              var _id = _step4.value;
              this.usedMergeEvents.add(_id);
            }
            this.lastCommandOutcome = lastOutcomeBefore;
            this._lastTickFault = rollbackFault ? fault + "|ROLLBACK:" + rollbackFault : fault;
            if (this.pending) {
              this.pending = null;
              this.state.nextCommandSequence++;
            }
            this.state.state = 'PAUSED';
            this.state.terminalReason = null;
            this._lastLogicMs = this.timingDiagnostics ? Math.max(0, performance.now() - logicStart - this._lastPhysicsMs) : 0;
            return [];
          }
        };
        _proto.pause = function pause(reason) {
          this.cancelPending('PAUSED_BEFORE_APPLY');
          if (this.state.state === 'PLAYING') this.state.state = 'PAUSED';
          if (reason === 'TECHNICAL_ERROR') {
            this.state.state = 'PAUSED';
            this.state.terminalReason = null;
          }
        };
        _proto.resume = function resume() {
          if (this.state.state !== 'PAUSED') return failure('INVALID_PHASE', '当前不能继续');
          this.state.state = 'PLAYING';
          this.state.epoch++;
          this.state.revision++;
          this.state.cupMotion.velocityXDuPerSecond = 0;
          this.state.cupMotion.targetOffsetXDu = this.state.cupMotion.offsetXDu;
          this.state.cupMotion.control = 'IDLE';
          this.adapter.setCupVelocityX(0);
          var resumeDelay = Math.max(this.rules.auto_drop.resume_delay_ticks, this.state.autoDrop.nextDueTick - this.state.tick);
          this.state.autoDrop.nextDueTick = this.state.tick + resumeDelay;
          return success(undefined);
        };
        _proto.abandon = function abandon() {
          if (this.ended || !['PLAYING', 'PAUSED'].includes(this.state.state)) return null;
          this.cancelPending('RUN_ABANDONED');
          return this.end('ABANDONED', this.state.tick);
        };
        _proto.snapshot = function snapshot() {
          this.refreshPhysicalStates();
          this.state.rng = this.rng.snapshot();
          this.state.spawnRng = this.spawnRng.snapshot();
          return cloneState(_extends({}, this.state, {
            ingredients: this.state.ingredients.slice().sort(function (a, b) {
              return a.entityId - b.entityId;
            })
          }));
        };
        _proto.restore = function restore(snapshot) {
          var validation = this.validateSnapshot(snapshot);
          if (!validation.ok) return validation;
          this.adapter.createCup(snapshot.stageId, snapshot.cupMotion.offsetXDu);
          this.adapter.setCupVelocityX(0);
          this.adapter.restoreBodies(snapshot.ingredients);
          this.state = cloneState(snapshot);
          this.state.state = 'PAUSED';
          this.state.cupMotion = {
            offsetXDu: snapshot.cupMotion.offsetXDu,
            velocityXDuPerSecond: 0,
            targetOffsetXDu: snapshot.cupMotion.offsetXDu,
            control: 'IDLE'
          };
          this.state.epoch++;
          this.rng = new RunRng(snapshot.rng.state, snapshot.rng.state, snapshot.rng.drawCount);
          this.spawnRng = new SpawnRng(snapshot.spawnRng.state, snapshot.spawnRng.state, snapshot.spawnRng.drawCount);
          this.ended = !!snapshot.terminalReason;
          this.pending = null;
          return success(undefined);
        };
        _proto.dispose = function dispose() {
          this.pending = null;
          this.adapter.dispose();
        };
        _proto.consumePending = function consumePending(tick, events) {
          var _this = this;
          var pending = this.pending;
          this.pending = null;
          var c = pending.envelope.command;
          var status = 'REJECTED';
          var errorCode;
          var message;
          if (c.runId !== this.state.runId || pending.envelope.ownerEpoch !== this.state.epoch) {
            errorCode = 'STALE_OWNER';
            message = '旧局命令已取消';
            status = 'CANCELLED';
          } else if (c.sequence !== this.state.nextCommandSequence) {
            errorCode = 'SEQUENCE_CONFLICT';
            message = '命令序号不匹配';
          } else if (c.kind === 'DROP') {
            var interval = Math.round(0.45 * this.rules.physics.fixed_hz);
            var blocked = this.state.shake.activeStartTick !== null && tick < this.state.shake.activeStartTick + 48;
            var x = this.clampSpawnX(this.state.currentLevel, c.xDu);
            if (this.state.lastDropTick !== null && tick - this.state.lastDropTick < interval) {
              errorCode = 'COOLDOWN';
              message = '投放间隔未到';
            } else if (blocked) {
              errorCode = 'SHAKE_ACTIVE';
              message = '晃杯期间不能投放';
            } else if (!this.adapter.canSpawn(this.state.currentLevel, x)) {
              errorCode = 'SPAWN_BLOCKED';
              message = '杯口被挡住，可移动或晃杯';
            } else {
              var entityId = this.state.nextEntityId;
              var item = this.rules.ingredients.find(function (i) {
                return i.level === _this.state.currentLevel;
              });
              try {
                this.adapter.createBody({
                  entityId: entityId,
                  level: item.level,
                  radiusDu: item.radius_du,
                  positionDu: {
                    x: x,
                    y: this.rules.cup.spawn_y_du
                  },
                  velocityDuPerSecond: {
                    x: 0,
                    y: 0
                  }
                });
                this.state.ingredients.push({
                  entityId: entityId,
                  level: item.level,
                  positionDu: {
                    x: x,
                    y: this.rules.cup.spawn_y_du
                  },
                  velocityDuPerSecond: {
                    x: 0,
                    y: 0
                  },
                  angleRadians: 0,
                  angularVelocity: 0,
                  bornTick: tick,
                  dangerEligible: false,
                  hasEnteredCup: false,
                  spillTicks: 0,
                  sleeping: false
                });
                this.state.nextEntityId++;
                this.state.dropIndex++;
                this.state.lastDropTick = tick;
                this.state.maxLevel = Math.max(this.state.maxLevel, item.level);
                this.state.currentLevel = this.state.nextLevel;
                this.state.nextLevel = this.rng.nextLevel(this.rules.drop.spawn_levels);
                this.state.autoDrop.pendingSpawn = this.nextSpawn(this.state.currentLevel);
                this.state.spawnRng = this.spawnRng.snapshot();
                var ev = {
                  kind: 'IngredientDropped',
                  eventId: deterministicEventId(this.state.runId, 'IngredientDropped', tick, [entityId]),
                  runId: this.state.runId,
                  tick: tick,
                  entityId: entityId,
                  level: item.level,
                  dropIndex: this.state.dropIndex
                };
                events.push(ev);
                status = 'APPLIED';
              } catch (error) {
                try {
                  if (this.adapter.getBody(entityId)) this.adapter.destroyBody(entityId);
                } catch (_unused2) {}
                errorCode = 'PHYSICS_CREATE_FAILED';
                message = String(error);
              }
            }
          } else if (c.kind === 'SHAKE') {
            var shakeTicks = Math.round(this.rules.shake.duration_seconds * this.rules.physics.fixed_hz);
            var active = this.state.shake.activeStartTick !== null && tick < this.state.shake.activeStartTick + shakeTicks;
            var availableExtra = this.state.shake.extraGranted - this.state.shake.extraUsed;
            if (this.state.ingredients.length === 0) {
              errorCode = 'SHAKE_EMPTY';
              message = '杯中还没有小料';
            } else if (c.source === 'base' && this.state.shake.baseUsed >= 2) {
              errorCode = 'NO_BASE_SHAKES';
              message = '本局基础晃杯次数已用完';
            } else if (c.source === 'rewarded_ad' && availableExtra < 1) {
              errorCode = 'NO_EXTRA_SHAKES';
              message = '本局奖励晃杯次数已用完';
            } else if (active || tick < this.state.shake.cooldownUntilTick) {
              errorCode = 'SHAKE_COOLDOWN';
              message = '晃杯正在进行或冷却中';
            } else {
              if (c.source === 'base') this.state.shake.baseUsed++;else {
                this.state.shake.extraUsed++;
                this.state.boardType = 'assisted';
              }
              this.state.shake.activeStartTick = tick;
              this.state.shake.cooldownUntilTick = tick + Math.round((this.rules.shake.duration_seconds + this.rules.shake.cooldown_seconds) * this.rules.physics.fixed_hz);
              events.push({
                kind: 'ShakeConsumed',
                eventId: deterministicEventId(this.state.runId, 'ShakeConsumed', tick, [c.sequence]),
                runId: this.state.runId,
                tick: tick,
                source: c.source
              });
              status = 'APPLIED';
            }
          } else {
            errorCode = 'CONTROL_COMMAND_REQUIRES_SESSION';
            message = '控制命令必须由运行会话在控制边界处理';
          }
          this.state.nextCommandSequence++;
          this.lastCommandOutcome = {
            commandId: c.commandId,
            sequence: c.sequence,
            status: status,
            appliedTick: tick,
            errorCode: errorCode,
            message: message
          };
          this.outcomes.set(c.commandId, this.lastCommandOutcome);
          if (this.outcomes.size > 256) this.outcomes["delete"](this.outcomes.keys().next().value);
        };
        _proto.cancelPending = function cancelPending(reason) {
          var pending = this.pending;
          if (!pending) return;
          this.pending = null;
          var command = pending.envelope.command;
          var outcome = {
            commandId: command.commandId,
            sequence: command.sequence,
            status: 'CANCELLED',
            appliedTick: this.state.tick,
            errorCode: reason,
            message: '玩法命令在暂停/结束边界前取消'
          };
          if (command.sequence === this.state.nextCommandSequence) this.state.nextCommandSequence++;
          this.lastCommandOutcome = outcome;
          this.outcomes.set(command.commandId, outcome);
          if (this.outcomes.size > 256) this.outcomes["delete"](this.outcomes.keys().next().value);
          this.state.revision++;
        };
        _proto.applyShake = function applyShake(tick) {
          var _this2 = this;
          var start = this.state.shake.activeStartTick,
            durationTicks = Math.round(this.rules.shake.duration_seconds * this.rules.physics.fixed_hz);
          if (start === null || tick < start || tick >= start + durationTicks) return;
          var cfg = this.rules.shake,
            t = (tick - start) / this.rules.physics.fixed_hz;
          var a = cfg.acceleration_amplitude * Math.pow(Math.sin(Math.PI * t / cfg.duration_seconds), 2) * Math.sin(2 * Math.PI * cfg.frequency_hz * t);
          var cup = this.rules.cup,
            center = cup.center_x_du + this.state.cupMotion.offsetXDu;
          var _loop = function _loop() {
            var _this2$rules$ingredie, _this2$rules$ingredie2;
            var entity = _step5.value;
            var radius = (_this2$rules$ingredie = (_this2$rules$ingredie2 = _this2.rules.ingredients.find(function (i) {
              return i.level === entity.level;
            })) == null ? void 0 : _this2$rules$ingredie2.radius_du) != null ? _this2$rules$ingredie : 0;
            var withinCup = entity.hasEnteredCup && entity.positionDu.y <= cup.inner_top_y_du + radius && entity.positionDu.y >= cup.inner_bottom_y_du - radius && Math.abs(entity.positionDu.x - center) <= cup.top_width_du / 2 + radius;
            if (withinCup) _this2.adapter.applyHorizontalAcceleration(entity.entityId, a);
          };
          for (var _iterator5 = _createForOfIteratorHelperLoose(this.state.ingredients), _step5; !(_step5 = _iterator5()).done;) {
            _loop();
          }
        };
        _proto.advanceCupMotion = function advanceCupMotion() {
          var m = this.state.cupMotion,
            dt = 1 / this.rules.physics.fixed_hz,
            cfg = this.rules.cup_motion,
            acc = cfg.acceleration_du_per_second2,
            maxV = cfg.max_speed_du_per_second;
          var actual = this.adapter.getCupOffsetX(),
            error = m.targetOffsetXDu - actual;
          if (m.control === 'DRAGGING' || m.control === 'SETTLING') {
            var desired = Math.max(-maxV, Math.min(maxV, error / Math.max(0.001, cfg.response_seconds)));
            var velocity = m.velocityXDuPerSecond + Math.max(-acc * dt, Math.min(acc * dt, desired - m.velocityXDuPerSecond));
            velocity = Math.max(-maxV, Math.min(maxV, velocity));
            if (Math.sign(velocity) === Math.sign(error) && Math.abs(velocity * dt) > Math.abs(error)) velocity = error / dt;
            if (Math.abs(error) <= cfg.snap_epsilon_du) {
              velocity = error / dt;
              m.control = 'IDLE';
              this.settleTicksRemaining = 0;
            }
            m.velocityXDuPerSecond = velocity;
            if (m.control === 'SETTLING' && --this.settleTicksRemaining <= 0) {
              m.targetOffsetXDu = actual + velocity * dt;
              m.control = 'IDLE';
            }
          } else m.velocityXDuPerSecond = 0;
          var max = this.rules.cup_motion.max_offset_du,
            next = actual + m.velocityXDuPerSecond * dt;
          if (next > max) m.velocityXDuPerSecond = Math.max(0, (max - actual) / dt);else if (next < -max) m.velocityXDuPerSecond = Math.min(0, (-max - actual) / dt);
          this.adapter.setCupVelocityX(m.velocityXDuPerSecond);
        };
        _proto.tryAutomaticDrop = function tryAutomaticDrop(tick, events) {
          var a = this.state.autoDrop;
          if (tick < a.nextDueTick) return;
          var shaking = this.state.shake.activeStartTick !== null && tick < this.state.shake.activeStartTick + Math.round(this.rules.shake.duration_seconds * this.rules.physics.fixed_hz);
          var d = a.pendingSpawn;
          if (shaking || !this.adapter.canSpawn(d.level, d.xDu)) {
            a.nextDueTick = tick + this.rules.auto_drop.blocked_retry_ticks;
            return;
          }
          var level = d.level,
            item = this.rules.ingredients.find(function (i) {
              return i.level === level;
            });
          var entityId = this.state.nextEntityId,
            x = d.xDu,
            y = this.rules.cup.spawn_y_du;
          this.adapter.createBody({
            entityId: entityId,
            level: level,
            radiusDu: item.radius_du,
            positionDu: {
              x: x,
              y: y
            },
            velocityDuPerSecond: {
              x: d.vxDuPerSecond,
              y: 0
            },
            angularVelocity: d.angularVelocity
          });
          this.state.ingredients.push({
            entityId: entityId,
            level: level,
            positionDu: {
              x: x,
              y: y
            },
            velocityDuPerSecond: {
              x: d.vxDuPerSecond,
              y: 0
            },
            angleRadians: 0,
            angularVelocity: d.angularVelocity,
            bornTick: tick,
            dangerEligible: false,
            hasEnteredCup: false,
            spillTicks: 0,
            sleeping: false
          });
          this.state.nextEntityId++;
          this.state.dropIndex++;
          this.state.lastDropTick = tick;
          this.state.maxLevel = Math.max(this.state.maxLevel, item.level);
          this.state.currentLevel = this.state.nextLevel;
          this.state.nextLevel = this.rng.nextLevel(this.rules.drop.spawn_levels);
          a.nextDueTick = tick + this.rules.auto_drop.interval_ticks;
          a.pendingSpawn = this.nextSpawn(this.state.currentLevel);
          this.state.spawnRng = this.spawnRng.snapshot();
          events.push({
            kind: 'IngredientDropped',
            eventId: deterministicEventId(this.state.runId, 'IngredientDropped', tick, [entityId]),
            runId: this.state.runId,
            tick: tick,
            entityId: entityId,
            level: level,
            dropIndex: this.state.dropIndex
          });
        };
        _proto.nextSpawn = function nextSpawn(level) {
          var offsets = this.rules.spawn_jitter.x_offsets_du,
            velocities = this.rules.spawn_jitter.vx_du_per_second;
          return {
            level: level,
            xDu: this.rules.cup.center_x_du + offsets[this.spawnRng.nextIndex(offsets.length)],
            vxDuPerSecond: velocities[this.spawnRng.nextIndex(velocities.length)],
            angularVelocity: 0
          };
        };
        _proto.refreshPhysicalStates = function refreshPhysicalStates() {
          for (var _iterator6 = _createForOfIteratorHelperLoose(this.state.ingredients), _step6; !(_step6 = _iterator6()).done;) {
            var item = _step6.value;
            var body = this.adapter.getBody(item.entityId);
            if (body) Object.assign(item, body);
          }
        };
        _proto.markEligible = function markEligible(id) {
          var item = this.state.ingredients.find(function (v) {
            return v.entityId === id;
          });
          if (item) item.dangerEligible = true;
        };
        _proto.resolveMerges = function resolveMerges(tick, contacts, events) {
          var _this3 = this;
          var byId = new Map(this.state.ingredients.map(function (item) {
            return [item.entityId, item];
          }));
          var unique = new Map();
          for (var _iterator7 = _createForOfIteratorHelperLoose(contacts), _step7; !(_step7 = _iterator7()).done;) {
            var c = _step7.value;
            if (c.secondId === null || c.firstId === c.secondId) continue;
            var a = Math.min(c.firstId, c.secondId),
              b = Math.max(c.firstId, c.secondId);
            var left = byId.get(a),
              right = byId.get(b);
            if (!left || !right || left.level !== right.level || left.level >= 9) continue;
            var dx = left.positionDu.x - right.positionDu.x,
              dy = left.positionDu.y - right.positionDu.y;
            unique.set(a + "|" + b, {
              a: a,
              b: b,
              level: left.level,
              distanceSq: dx * dx + dy * dy
            });
          }
          var sorted = Array.from(unique.values()).sort(function (a, b) {
            return a.level - b.level || a.distanceSq - b.distanceSq || a.a - b.a || a.b - b.b;
          });
          var used = new Set();
          var _loop2 = function _loop2() {
              var pair = _step8.value;
              if (used.has(pair.a) || used.has(pair.b)) return 0; // continue
              var a = byId.get(pair.a),
                b = byId.get(pair.b);
              used.add(pair.a);
              used.add(pair.b);
              var cfg = _this3.rules.ingredients.find(function (i) {
                return i.level === a.level + 1;
              });
              if (!cfg) return 0; // continue
              var childId = _this3.state.nextEntityId;
              var wallContactProjectionMarginDu = _this3.adapter.wallContactProjectionMarginDu;
              var position = _this3.projectChild({
                x: (a.positionDu.x + b.positionDu.x) / 2,
                y: (a.positionDu.y + b.positionDu.y) / 2
              }, cfg.radius_du, Number.isFinite(wallContactProjectionMarginDu) ? Math.max(0, wallContactProjectionMarginDu) : 0);
              if (!position) {
                _this3.pause('TECHNICAL_ERROR');
                throw new Error('MERGE_PROJECTION_NO_LEGAL_POINT');
              }
              var velocity = {
                x: (a.velocityDuPerSecond.x + b.velocityDuPerSecond.x) / 2,
                y: (a.velocityDuPerSecond.y + b.velocityDuPerSecond.y) / 2
              };
              var speed = Math.hypot(velocity.x, velocity.y),
                max = _this3.rules.physics.max_linear_speed * _this3.rules.viewport.du_per_spec_physics_unit;
              if (speed > max) {
                velocity.x *= max / speed;
                velocity.y *= max / speed;
              }
              var sinAngle = Math.sin(a.angleRadians) + Math.sin(b.angleRadians),
                cosAngle = Math.cos(a.angleRadians) + Math.cos(b.angleRadians);
              var angleRadians = Math.hypot(sinAngle, cosAngle) < 1e-8 ? pair.a < pair.b ? a.angleRadians : b.angleRadians : Math.atan2(sinAngle, cosAngle);
              var angularLimit = _this3.rules.physics.max_angular_speed;
              var angularVelocity = Math.max(-angularLimit, Math.min(angularLimit, (a.angularVelocity + b.angularVelocity) / 2));
              var replacement = _this3.adapter.replaceParentsWithChild([pair.a, pair.b], {
                entityId: childId,
                level: cfg.level,
                radiusDu: cfg.radius_du,
                positionDu: position,
                velocityDuPerSecond: velocity,
                angleRadians: angleRadians,
                angularVelocity: angularVelocity
              });
              if (!replacement.ok) {
                _this3.pause('TECHNICAL_ERROR');
                throw new Error("MERGE_REPLACE_FAILED:" + replacement.error.code + ":" + replacement.error.message);
              }
              var fixtureProbe = _this3.adapter.recordFixtureMerge;
              fixtureProbe == null || fixtureProbe.call(_this3.adapter, {
                tick: tick,
                parentIds: [pair.a, pair.b],
                parents: [cloneState(a), cloneState(b)],
                neighbors: _this3.state.ingredients.filter(function (item) {
                  return item.entityId !== pair.a && item.entityId !== pair.b;
                }).map(function (item) {
                  return cloneState(item);
                }),
                child: {
                  entityId: childId,
                  level: cfg.level,
                  radiusDu: cfg.radius_du,
                  positionDu: _extends({}, position),
                  velocityDuPerSecond: _extends({}, velocity),
                  angleRadians: angleRadians,
                  angularVelocity: angularVelocity
                },
                inherited: {
                  bornTick: Math.min(a.bornTick, b.bornTick),
                  dangerEligible: a.dangerEligible || b.dangerEligible,
                  hasEnteredCup: a.hasEnteredCup || b.hasEnteredCup,
                  spillTicks: Math.max(a.spillTicks, b.spillTicks)
                }
              });
              var units = _this3.rules.ingredients.find(function (i) {
                return i.level === a.level;
              }).units * 2;
              var score = cfg.merge_score;
              _this3.state.ingredients = _this3.state.ingredients.filter(function (i) {
                return i.entityId !== pair.a && i.entityId !== pair.b;
              });
              _this3.state.ingredients.push({
                entityId: childId,
                level: cfg.level,
                positionDu: position,
                velocityDuPerSecond: velocity,
                angleRadians: angleRadians,
                angularVelocity: angularVelocity,
                bornTick: Math.min(a.bornTick, b.bornTick),
                dangerEligible: a.dangerEligible || b.dangerEligible,
                hasEnteredCup: a.hasEnteredCup || b.hasEnteredCup,
                spillTicks: Math.max(a.spillTicks, b.spillTicks),
                sleeping: false
              });
              _this3.state.nextEntityId++;
              _this3.state.maxLevel = Math.max(_this3.state.maxLevel, cfg.level);
              var eventId = deterministicEventId(_this3.state.runId, 'MergeCommitted', tick, [pair.a, pair.b]);
              if (!_this3.usedMergeEvents.has(eventId)) {
                _this3.usedMergeEvents.add(eventId);
                _this3.state.score += score;
                events.push({
                  kind: 'MergeCommitted',
                  eventId: eventId,
                  runId: _this3.state.runId,
                  tick: tick,
                  parents: [pair.a, pair.b],
                  childId: childId,
                  childLevel: cfg.level,
                  scoreDelta: score,
                  units: units,
                  positionDu: position
                });
              }
            },
            _ret;
          for (var _iterator8 = _createForOfIteratorHelperLoose(sorted), _step8; !(_step8 = _iterator8()).done;) {
            _ret = _loop2();
            if (_ret === 0) continue;
          }
        };
        _proto.updateDanger = function updateDanger(tick, events) {
          var _this4 = this;
          for (var _iterator9 = _createForOfIteratorHelperLoose(this.state.ingredients), _step9; !(_step9 = _iterator9()).done;) {
            var item = _step9.value;
            if (!item.dangerEligible && tick - item.bornTick >= 45) item.dangerEligible = true;
          }
          var before = this.state.dangerTicks;
          var line = this.rules.cup.danger_line_y_du;
          var over = this.state.ingredients.some(function (i) {
            return i.dangerEligible && i.positionDu.y + _this4.radius(i.level) > line;
          });
          this.state.dangerTicks = over ? before + 1 : 0;
          if (this.state.dangerTicks !== before) events.push({
            kind: 'DangerChanged',
            eventId: deterministicEventId(this.state.runId, 'DangerChanged', tick, [this.state.dangerTicks]),
            runId: this.state.runId,
            tick: tick,
            dangerTicks: this.state.dangerTicks
          });
          return this.state.dangerTicks >= Math.round(3 * this.rules.physics.fixed_hz);
        };
        _proto.updateSpill = function updateSpill(_tick) {
          var top = this.rules.cup.inner_top_y_du,
            spilled = [];
          for (var _iterator10 = _createForOfIteratorHelperLoose(this.state.ingredients), _step10; !(_step10 = _iterator10()).done;) {
            var item = _step10.value;
            if (item.positionDu.y + this.radius(item.level) <= top) item.hasEnteredCup = true;
            if (item.hasEnteredCup && item.positionDu.y - this.radius(item.level) > top) item.spillTicks++;else item.spillTicks = 0;
            if (item.spillTicks >= Math.round(.5 * this.rules.physics.fixed_hz)) spilled.push(item.entityId);
          }
          return spilled;
        }
        /** Freeze the spill and publish a deterministic cleanup candidate. False means no legal offer; settle normally. */;
        _proto.beginSpillPending = function beginSpillPending(tick, spilledEntityIds) {
          if (!this.reviveOptions.enabled || this.state.revive.used !== 0 || this.state.state !== 'PLAYING' || this.ended) return false;
          var candidate = this.computeSpillCandidate(tick, spilledEntityIds);
          if (candidate.ingredients.length === 0) return false;
          var failureId = deterministicEventId(this.state.runId, 'SpillPendingFailure', tick, spilledEntityIds);
          this.state.revive.pendingFailure = {
            version: 1,
            failureId: failureId,
            detectedTick: tick,
            reason: 'SPILLED',
            spilledEntityIds: spilledEntityIds.slice().sort(function (a, b) {
              return a - b;
            }),
            clearanceDu: this.reviveOptions.clearanceDu,
            candidateHash: candidate.candidateHash,
            retainedEntityIds: candidate.retainedEntityIds.slice()
          };
          this.state.state = 'PAUSED';
          this.state.terminalReason = null;
          this.state.revision++;
          return true;
        };
        _proto.computeSpillCandidate = function computeSpillCandidate(detectedTick, spilledEntityIds) {
          var top = this.rules.cup.inner_top_y_du,
            clearance = Math.max(0, this.reviveOptions.clearanceDu),
            spilled = new Set(spilledEntityIds);
          var removedEntityIds = [],
            ingredients = [];
          for (var _iterator11 = _createForOfIteratorHelperLoose(this.state.ingredients.slice().sort(function (a, b) {
              return a.entityId - b.entityId;
            })), _step11; !(_step11 = _iterator11()).done;) {
            var item = _step11.value;
            var r = this.radius(item.level),
              out = spilled.has(item.entityId) || item.spillTicks > 0 || item.positionDu.y + r > this.rules.cup.danger_line_y_du - clearance || ![item.positionDu.x, item.positionDu.y, item.velocityDuPerSecond.x, item.velocityDuPerSecond.y, item.angleRadians, item.angularVelocity].every(Number.isFinite);
            if (out) {
              removedEntityIds.push(item.entityId);
              continue;
            }
            var x = item.positionDu.x;
            var y = item.positionDu.y;
            var bottom = this.rules.cup.inner_bottom_y_du,
              limit = top - r - 1;
            if (y > limit) y = Math.max(bottom - r, limit);
            ingredients.push(_extends({}, item, {
              positionDu: {
                x: x,
                y: y
              },
              velocityDuPerSecond: {
                x: 0,
                y: 0
              },
              angleRadians: item.angleRadians,
              angularVelocity: 0,
              dangerEligible: false,
              spillTicks: 0,
              sleeping: false
            }));
          }
          var retainedEntityIds = ingredients.map(function (i) {
            return i.entityId;
          });
          var candidate = {
            candidateId: deterministicEventId(this.state.runId, 'SpillReviveCandidate', detectedTick, spilledEntityIds),
            failureId: deterministicEventId(this.state.runId, 'SpillPendingFailure', detectedTick, spilledEntityIds),
            detectedTick: detectedTick,
            spilledEntityIds: [].concat(spilledEntityIds).sort(function (a, b) {
              return a - b;
            }),
            removedEntityIds: removedEntityIds,
            retainedEntityIds: retainedEntityIds,
            score: this.state.score,
            maxLevel: this.state.maxLevel,
            dropIndex: this.state.dropIndex,
            currentLevel: this.state.currentLevel,
            nextLevel: this.state.nextLevel,
            nextEntityId: this.state.nextEntityId,
            tick: detectedTick,
            rng: this.rng.snapshot(),
            spawnRng: this.spawnRng.snapshot(),
            cupOffsetXDu: 0,
            shake: _extends({}, this.state.shake),
            dangerTicks: this.state.dangerTicks,
            autoDrop: {
              nextDueTick: detectedTick + Math.max(0, this.reviveOptions.autoDropDelayTicks),
              pendingSpawn: _extends({}, this.state.autoDrop.pendingSpawn)
            },
            ingredients: ingredients,
            candidateHash: ''
          };
          var hashInput = {
            failureId: candidate.failureId,
            detectedTick: detectedTick,
            spilledEntityIds: candidate.spilledEntityIds,
            removedEntityIds: removedEntityIds,
            retainedEntityIds: retainedEntityIds,
            score: candidate.score,
            maxLevel: candidate.maxLevel,
            dropIndex: candidate.dropIndex,
            currentLevel: candidate.currentLevel,
            nextLevel: candidate.nextLevel,
            nextEntityId: candidate.nextEntityId,
            rng: candidate.rng,
            spawnRng: candidate.spawnRng,
            dangerTicks: candidate.dangerTicks,
            pendingSpawn: candidate.autoDrop.pendingSpawn,
            ingredients: ingredients.map(function (i) {
              return {
                entityId: i.entityId,
                level: i.level,
                positionDu: i.positionDu,
                velocityDuPerSecond: i.velocityDuPerSecond,
                angleRadians: i.angleRadians,
                angularVelocity: i.angularVelocity,
                hasEnteredCup: i.hasEnteredCup
              };
            })
          };
          candidate.candidateHash = sha256Utf8(JSON.stringify(hashInput));
          return candidate;
        };
        _proto.end = function end(reason, tick) {
          this.ended = true;
          this.state.state = 'SETTLING';
          this.state.terminalReason = reason;
          this.state.settleStartedTick = tick;
          this.state.revive.pendingFailure = null;
          return {
            kind: 'RunEnded',
            eventId: deterministicEventId(this.state.runId, 'RunEnded', tick, [reason]),
            runId: this.state.runId,
            tick: tick,
            reason: reason,
            score: this.state.score
          };
        };
        _proto.radius = function radius(level) {
          var _this$rules$ingredien, _this$rules$ingredien2;
          return (_this$rules$ingredien = (_this$rules$ingredien2 = this.rules.ingredients.find(function (i) {
            return i.level === level;
          })) == null ? void 0 : _this$rules$ingredien2.radius_du) != null ? _this$rules$ingredien : 0;
        };
        _proto.clampSpawnX = function clampSpawnX(level, x) {
          var r = this.radius(level);
          var g = this.rules.cup;
          return Math.min(g.center_x_du + g.top_width_du / 2 - r, Math.max(g.center_x_du - g.top_width_du / 2 + r, x));
        };
        _proto.projectChild = function projectChild(p, radius, wallMargin) {
          var _validPoints$;
          var cup = this.rules.cup;
          var bottom = cup.inner_bottom_y_du;
          var top = cup.inner_top_y_du;
          if (p.y - radius > top) return p;
          var slope = (cup.top_width_du - cup.bottom_width_du) / (2 * (top - bottom));
          var leftBottom = cup.center_x_du + this.state.cupMotion.offsetXDu - cup.bottom_width_du / 2,
            rightBottom = cup.center_x_du + this.state.cupMotion.offsetXDu + cup.bottom_width_du / 2;
          var leftN = {
              x: 1 / Math.hypot(1, slope),
              y: -slope / Math.hypot(1, slope)
            },
            rightN = {
              x: -1 / Math.hypot(1, slope),
              y: -slope / Math.hypot(1, slope)
            };
          var safeRadius = radius + wallMargin;
          var c = [{
            n: {
              x: 0,
              y: 1
            },
            b: bottom + safeRadius
          }, {
            n: leftN,
            b: leftN.x * leftBottom + leftN.y * bottom + safeRadius
          }, {
            n: rightN,
            b: rightN.x * rightBottom + rightN.y * bottom + safeRadius
          }];
          var valid = function valid(q) {
            return c.every(function (v) {
              return v.n.x * q.x + v.n.y * q.y >= v.b - 1e-8;
            }) && q.y - radius <= top + 1e-8;
          };
          var candidates = [p];
          for (var _i = 0, _c = c; _i < _c.length; _i++) {
            var v = _c[_i];
            var d = v.b - v.n.x * p.x - v.n.y * p.y;
            candidates.push({
              x: p.x + v.n.x * d,
              y: p.y + v.n.y * d
            });
          }
          for (var i = 0; i < c.length; i++) for (var j = i + 1; j < c.length; j++) {
            var a = c[i],
              b = c[j],
              det = a.n.x * b.n.y - a.n.y * b.n.x;
            if (Math.abs(det) > 1e-9) candidates.push({
              x: (a.b * b.n.y - a.n.y * b.b) / det,
              y: (a.n.x * b.b - a.b * b.n.x) / det
            });
          }
          var validPoints = candidates.filter(valid).sort(function (a, b) {
            return Math.pow(a.x - p.x, 2) + Math.pow(a.y - p.y, 2) - (Math.pow(b.x - p.x, 2) + Math.pow(b.y - p.y, 2)) || a.x - b.x || a.y - b.y;
          });
          return (_validPoints$ = validPoints[0]) != null ? _validPoints$ : null;
        };
        _proto.validateSnapshot = function validateSnapshot(value) {
          var _value$autoDrop;
          if (!value || value.saveSchemaVersion !== 5 || !Number.isSafeInteger(value.tick) || value.tick < 0 || !Number.isSafeInteger(value.score) || value.score < 0 || !Array.isArray(value.ingredients) || !value.cupMotion || !Number.isFinite(value.cupMotion.offsetXDu) || Math.abs(value.cupMotion.offsetXDu) > this.rules.cup_motion.max_offset_du || !Number.isFinite(value.cupMotion.velocityXDuPerSecond) || Math.abs(value.cupMotion.velocityXDuPerSecond) > this.rules.cup_motion.max_speed_du_per_second || !Number.isFinite(value.cupMotion.targetOffsetXDu) || Math.abs(value.cupMotion.targetOffsetXDu) > this.rules.cup_motion.max_offset_du || !['IDLE', 'DRAGGING', 'SETTLING'].includes(value.cupMotion.control) || !Number.isSafeInteger((_value$autoDrop = value.autoDrop) == null ? void 0 : _value$autoDrop.nextDueTick) || value.autoDrop.nextDueTick < value.tick || !value.spawnRng || value.spawnRng.state === 0 || !value.autoDrop.pendingSpawn || value.autoDrop.pendingSpawn.level !== value.currentLevel) return failure('SAVE_INVALID', '存档基础字段无效');
          var shake = value.shake;
          if (!shake || !Number.isSafeInteger(shake.baseUsed) || shake.baseUsed < 0 || shake.baseUsed > 2 || !Number.isSafeInteger(shake.extraGranted) || shake.extraGranted < 0 || shake.extraGranted > 5 || !Number.isSafeInteger(shake.extraUsed) || shake.extraUsed < 0 || shake.extraUsed > shake.extraGranted) return failure('SAVE_INVALID', '存档晃杯账本无效');
          var revive = value.revive;
          if (!revive || !Number.isSafeInteger(revive.used) || revive.used < 0 || revive.used > 1) return failure('SAVE_INVALID', '存档复活账本无效');
          if (revive.pendingFailure !== null) {
            var p = revive.pendingFailure;
            if (p.version !== 1 || p.reason !== 'SPILLED' || typeof p.failureId !== 'string' || !UUID_PATTERN.test(p.failureId) || !Number.isSafeInteger(p.detectedTick) || p.detectedTick < 0 || p.detectedTick > value.tick || !Array.isArray(p.spilledEntityIds) || !Array.isArray(p.retainedEntityIds) || !Number.isSafeInteger(p.clearanceDu) || p.clearanceDu < 0 || typeof p.candidateHash !== 'string' || p.candidateHash.length !== 64) return failure('SAVE_INVALID', '存档复活待处理数据无效');
            if (value.state !== 'PAUSED' || value.terminalReason !== null) return failure('SAVE_INVALID', '待复活局必须处于暂停');
          } else if (revive.committedReceiptId !== null && (typeof revive.committedReceiptId !== 'string' || !UUID_PATTERN.test(revive.committedReceiptId))) return failure('SAVE_INVALID', '存档复活凭证无效');
          if (value.boardType !== 'standard' && value.boardType !== 'assisted' || value.boardType === 'assisted' !== (shake.extraUsed > 0 || revive.used > 0)) return failure('SAVE_INVALID', '存档局类型与奖励不一致');
          var ids = new Set();
          for (var _iterator12 = _createForOfIteratorHelperLoose(value.ingredients), _step12; !(_step12 = _iterator12()).done;) {
            var item = _step12.value;
            if (ids.has(item.entityId) || !Number.isSafeInteger(item.entityId) || ![item.positionDu.x, item.positionDu.y, item.velocityDuPerSecond.x, item.velocityDuPerSecond.y, item.angleRadians, item.angularVelocity].every(Number.isFinite)) return failure('SAVE_INVALID', '存档实体无效');
            ids.add(item.entityId);
          }
          if (value.nextEntityId <= Math.max.apply(Math, [0].concat(ids)) || value.rng.state === 0 || value.rng.drawCount !== value.dropIndex + 2) return failure('SAVE_INVALID', '存档跨字段校验失败');
          return success(undefined);
        };
        _proto.assertInvariants = function assertInvariants() {
          var ids = new Set();
          for (var _iterator13 = _createForOfIteratorHelperLoose(this.state.ingredients), _step13; !(_step13 = _iterator13()).done;) {
            var item = _step13.value;
            if (ids.has(item.entityId)) throw new Error('DUPLICATE_ENTITY_ID');
            ids.add(item.entityId);
            if (![item.positionDu.x, item.positionDu.y, item.velocityDuPerSecond.x, item.velocityDuPerSecond.y, item.angleRadians, item.angularVelocity].every(Number.isFinite)) throw new Error('NON_FINITE_BODY');
          }
          if (!Number.isSafeInteger(this.state.tick) || !Number.isSafeInteger(this.state.score) || this.state.score < 0) throw new Error('RUN_INVARIANT_BROKEN');
        };
        _createClass(RunEngine, [{
          key: "phase",
          get: function get() {
            return this.state.state;
          }
        }, {
          key: "tick",
          get: function get() {
            return this.state.tick;
          }
        }, {
          key: "presentationCupOffsetXDu",
          get: function get() {
            return this.adapter.getCupOffsetX();
          }
        }, {
          key: "presentationShakeStartTick",
          get: function get() {
            return this.state.shake.activeStartTick;
          }
        }, {
          key: "presentationTick",
          get: function get() {
            return this.state.tick;
          }
        }, {
          key: "entityCount",
          get: function get() {
            return this.state.ingredients.length;
          }
        }, {
          key: "hasPendingCommand",
          get: function get() {
            return this.pending !== null;
          }
        }, {
          key: "currentOutcome",
          get: function get() {
            return this.lastCommandOutcome ? _extends({}, this.lastCommandOutcome) : null;
          }
        }, {
          key: "lastPhysicsMs",
          get: function get() {
            return this._lastPhysicsMs;
          }
        }, {
          key: "lastLogicMs",
          get: function get() {
            return this._lastLogicMs;
          }
        }, {
          key: "lastTickFault",
          get: function get() {
            return this._lastTickFault;
          }
          /** Complete pre-transaction data also supports hosts without durable storage. */
        }, {
          key: "recoveryCheckpoint",
          get: function get() {
            return this._recoveryCheckpoint ? cloneState(this._recoveryCheckpoint) : null;
          }
        }, {
          key: "spillPending",
          get: function get() {
            return this.state.revive.pendingFailure ? cloneState(this.state.revive.pendingFailure) : null;
          }
        }, {
          key: "reviveUsed",
          get: function get() {
            return this.state.revive.used;
          }
        }, {
          key: "reviveReceiptId",
          get: function get() {
            return this.state.revive.committedReceiptId;
          }
        }]);
        return RunEngine;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/RunRng.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
  var _createForOfIteratorHelperLoose, cclegacy;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      cclegacy._RF.push({}, "1a518kE+XJN07I6PksaAuEj", "RunRng", undefined);
      /** Deterministic xorshift32 stream owned only by one run. */
      var RunRng = exports('RunRng', /*#__PURE__*/function () {
        function RunRng(seed, state, drawCount) {
          if (drawCount === void 0) {
            drawCount = 0;
          }
          this.state = void 0;
          this.draws = void 0;
          if (!Number.isSafeInteger(seed) || seed <= 0 || seed > 0xffffffff) throw new Error('SEED_MUST_BE_NONZERO_UINT32');
          this.state = (state != null ? state : seed) >>> 0;
          if (this.state === 0) throw new Error('RNG_STATE_CANNOT_BE_ZERO');
          if (!Number.isSafeInteger(drawCount) || drawCount < 0) throw new Error('RNG_DRAW_COUNT_INVALID');
          this.draws = drawCount;
        }
        var _proto = RunRng.prototype;
        _proto.nextU32 = function nextU32() {
          var x = this.state >>> 0;
          x ^= x << 13;
          x ^= x >>> 17;
          x ^= x << 5;
          this.state = x >>> 0;
          this.draws++;
          return this.state;
        };
        _proto.nextLevel = function nextLevel(weights) {
          var value = this.nextU32() / 0x100000000;
          var total = weights.reduce(function (sum, item) {
            return sum + item.weight;
          }, 0);
          var cursor = value * total;
          for (var _iterator = _createForOfIteratorHelperLoose(weights), _step; !(_step = _iterator()).done;) {
            var item = _step.value;
            cursor -= item.weight;
            if (cursor < 0) return item.level;
          }
          return weights[weights.length - 1].level;
        };
        _proto.snapshot = function snapshot() {
          return {
            algorithm: 'xorshift32_v1_nonzero_seed',
            state: this.state,
            drawCount: this.draws
          };
        };
        return RunRng;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/SaveCodec.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './CloneState.ts', './Sha256.ts'], function (exports) {
  var _createForOfIteratorHelperLoose, _extends, cclegacy, cloneState, sha256Utf8;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
      _extends = module.extends;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      cloneState = module.cloneState;
    }, function (module) {
      sha256Utf8 = module.sha256Utf8;
    }],
    execute: function () {
      exports('canonicalJson', _canonicalJson);
      cclegacy._RF.push({}, "13e00XMT2JAmoYjn4K6zRcx", "SaveCodec", undefined);
      function normalize(value, seen) {
        if (seen === void 0) {
          seen = new Set();
        }
        if (typeof value === 'number') {
          if (!Number.isFinite(value) || !Number.isSafeInteger(value) && Number.isInteger(value)) throw new Error('SAVE_NUMBER_INVALID');
          return Object.is(value, -0) ? 0 : value;
        }
        if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
        if (Array.isArray(value)) {
          if (seen.has(value)) throw new Error('SAVE_CYCLE');
          seen.add(value);
          var _result = value.map(function (v) {
            return normalize(v, seen);
          });
          seen["delete"](value);
          return _result;
        }
        if (typeof value !== 'object' || value === undefined) throw new Error('SAVE_VALUE_UNSUPPORTED');
        if (seen.has(value)) throw new Error('SAVE_CYCLE');
        seen.add(value);
        var object = value;
        var result = {};
        for (var _iterator = _createForOfIteratorHelperLoose(Object.keys(object).sort()), _step; !(_step = _iterator()).done;) {
          var key = _step.value;
          if (object[key] === undefined) throw new Error("SAVE_UNDEFINED:" + key);
          result[key] = normalize(object[key], seen);
        }
        seen["delete"](value);
        return result;
      }
      function _canonicalJson(value) {
        var projected = normalize(value);
        if (projected && Array.isArray(projected.ingredients)) projected.ingredients.sort(function (a, b) {
          return a.entityId - b.entityId;
        });
        return JSON.stringify(projected);
      }
      var SaveCodec = exports('SaveCodec', /*#__PURE__*/function () {
        function SaveCodec() {}
        SaveCodec.canonicalJson = function canonicalJson(value) {
          return _canonicalJson(value);
        };
        SaveCodec.sealSnapshot = function sealSnapshot(snapshot) {
          var copy = cloneState(snapshot);
          copy.ingredients.sort(function (a, b) {
            return a.entityId - b.entityId;
          });
          copy.checksum = '';
          copy.checksum = sha256Utf8(_canonicalJson(copy));
          return copy;
        };
        SaveCodec.verifySnapshot = function verifySnapshot(snapshot) {
          if (!snapshot || typeof snapshot.checksum !== 'string' || !/^[0-9a-f]{64}$/.test(snapshot.checksum)) return false;
          var copy = cloneState(snapshot);
          var expected = copy.checksum;
          copy.checksum = '';
          return sha256Utf8(_canonicalJson(copy)) === expected;
        };
        SaveCodec.createEnvelope = function createEnvelope(revision, payload) {
          var sealedPayload = _extends({}, cloneState(payload), {
            run: payload.run ? this.sealSnapshot(payload.run) : null
          });
          var envelope = {
            schemaVersion: 1,
            revision: revision,
            payload: sealedPayload,
            checksum: ''
          };
          envelope.checksum = sha256Utf8(_canonicalJson({
            schemaVersion: envelope.schemaVersion,
            revision: envelope.revision,
            payload: envelope.payload
          }));
          return envelope;
        };
        SaveCodec.verifyEnvelope = function verifyEnvelope(envelope) {
          if (!envelope || envelope.schemaVersion !== 1 || !Number.isSafeInteger(envelope.revision) || envelope.revision < 0 || !/^[0-9a-f]{64}$/.test(envelope.checksum)) return false;
          if (envelope.payload.run && !this.verifySnapshot(envelope.payload.run)) return false;
          return sha256Utf8(_canonicalJson({
            schemaVersion: envelope.schemaVersion,
            revision: envelope.revision,
            payload: envelope.payload
          })) === envelope.checksum;
        };
        SaveCodec.createEnvelopeV2 = function createEnvelopeV2(revision, payload) {
          var sealedPayload = _extends({}, cloneState(payload), {
            run: payload.run ? this.sealSnapshot(payload.run) : null
          });
          var envelope = {
            schemaVersion: 2,
            revision: revision,
            payload: sealedPayload,
            checksum: ''
          };
          envelope.checksum = sha256Utf8(_canonicalJson({
            schemaVersion: envelope.schemaVersion,
            revision: envelope.revision,
            payload: envelope.payload
          }));
          return envelope;
        };
        SaveCodec.verifyEnvelopeV2 = function verifyEnvelopeV2(envelope) {
          if (!envelope || envelope.schemaVersion !== 2 || !Number.isSafeInteger(envelope.revision) || envelope.revision < 0 || !/^[0-9a-f]{64}$/.test(envelope.checksum)) return false;
          if (envelope.payload.run && !this.verifySnapshot(envelope.payload.run)) return false;
          return sha256Utf8(_canonicalJson({
            schemaVersion: envelope.schemaVersion,
            revision: envelope.revision,
            payload: envelope.payload
          })) === envelope.checksum;
        };
        return SaveCodec;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/SaveMigration.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './SaveCodec.ts'], function (exports) {
  var _extends, cclegacy, SaveCodec;
  return {
    setters: [function (module) {
      _extends = module.extends;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      SaveCodec = module.SaveCodec;
    }],
    execute: function () {
      cclegacy._RF.push({}, "a2d35r/jqZMQ7LESRV8/PlZ", "SaveMigration", undefined);

      /**
       * Read-only schema upgrades. A migrated bundle is never written during boot; it is only written at a
       * normal gameplay checkpoint so a failed config/image load cannot change the player's saved progress.
       */
      var SaveMigration = exports('SaveMigration', /*#__PURE__*/function () {
        function SaveMigration() {}
        SaveMigration.runV3 = function runV3(legacy) {
          var source = legacy;
          var migrated = _extends({}, source, {
            saveSchemaVersion: 5,
            spawnRng: {
              algorithm: 'spawn-xorshift32-v1',
              state: 0x6d2b79f5,
              drawCount: 0
            },
            autoDrop: {
              nextDueTick: source.autoDrop.nextDueTick,
              pendingSpawn: {
                level: source.currentLevel,
                xDu: 375,
                vxDuPerSecond: 0,
                angularVelocity: 0
              }
            },
            revive: {
              used: 0,
              pendingFailure: null,
              committedReceiptId: null
            },
            checksum: ''
          });
          return SaveCodec.sealSnapshot(migrated);
        }
        /** Schema-4 saves predate the spill-revive ledger; nothing is granted retroactively. */;
        SaveMigration.runV4 = function runV4(legacy) {
          var source = legacy;
          var migrated = _extends({}, source, {
            saveSchemaVersion: 5,
            revive: {
              used: 0,
              pendingFailure: null,
              committedReceiptId: null
            },
            checksum: ''
          });
          return SaveCodec.sealSnapshot(migrated);
        };
        SaveMigration.bundle = function bundle(legacy) {
          return {
            profile: this.profile(legacy.profile, legacy.lastResult),
            run: legacy.run ? this.run(legacy.run) : null,
            lastResult: legacy.lastResult ? this.lastResult(legacy.lastResult) : null
          };
        };
        SaveMigration.profile = function profile(legacy, lastResult) {
          return _extends({}, legacy, {
            schemaVersion: 3,
            firstNaturalRunCompleted: !!lastResult && (lastResult.reason === 'CUP_FULL' || lastResult.reason === 'SPILLED'),
            rewardedShake: {
              dayKey: null,
              dailyGranted: 0,
              pendingAttempt: null,
              receipts: []
            },
            rewardedRevive: {
              dayKey: null,
              dailyGranted: 0,
              pendingAttempt: null,
              receipts: []
            }
          });
        };
        SaveMigration.profileV2 = function profileV2(legacy) {
          return _extends({}, legacy, {
            schemaVersion: 3,
            rewardedRevive: {
              dayKey: null,
              dailyGranted: 0,
              pendingAttempt: null,
              receipts: []
            }
          });
        };
        SaveMigration.run = function run(legacy) {
          var source = legacy;
          var tick = Number(source.tick);
          var migrated = _extends({}, source, {
            saveSchemaVersion: 5,
            shake: _extends({}, source.shake, {
              extraGranted: 0
            }),
            cupMotion: source.cupMotion ? source.cupMotion : {
              offsetXDu: 0,
              velocityXDuPerSecond: 0,
              targetOffsetXDu: 0,
              control: 'IDLE'
            },
            spawnRng: {
              algorithm: 'spawn-xorshift32-v1',
              state: 0x6d2b79f5,
              drawCount: 0
            },
            autoDrop: {
              nextDueTick: source.autoDrop ? Number(source.autoDrop.nextDueTick) : (Number.isSafeInteger(tick) ? tick : 0) + 1,
              pendingSpawn: {
                level: Number(source.currentLevel),
                xDu: 375,
                vxDuPerSecond: 0,
                angularVelocity: 0
              }
            },
            revive: {
              used: 0,
              pendingFailure: null,
              committedReceiptId: null
            },
            checksum: ''
          });
          return SaveCodec.sealSnapshot(migrated);
        };
        SaveMigration.lastResult = function lastResult(legacy) {
          return {
            runId: legacy.runId,
            reason: legacy.reason,
            score: legacy.score,
            maxLevel: legacy.maxLevel,
            dropIndex: legacy.dropIndex,
            baseUsed: legacy.baseUsed,
            extraUsed: 0,
            boardType: 'standard',
            rulesVersion: legacy.rulesVersion
          };
        };
        return SaveMigration;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/SaveValidator.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './SaveCodec.ts'], function (exports) {
  var _createForOfIteratorHelperLoose, cclegacy, SaveCodec;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      SaveCodec = module.SaveCodec;
    }],
    execute: function () {
      cclegacy._RF.push({}, "697b8pNitdJNLIN9ExDCljD", "SaveValidator", undefined);
      var ok = function ok() {
        return {
          valid: true,
          code: null,
          message: null
        };
      };
      var bad = function bad(code, message) {
        return {
          valid: false,
          code: code,
          message: message
        };
      };
      var object = function object(v) {
        return !!v && typeof v === 'object' && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype;
      };
      var keys = function keys(v, allowed) {
        return Object.keys(v).every(function (k) {
          return allowed.includes(k);
        });
      };
      var integer = function integer(v, min, max) {
        if (max === void 0) {
          max = Number.MAX_SAFE_INTEGER;
        }
        return Number.isSafeInteger(v) && Number(v) >= min && Number(v) <= max;
      };
      var finite = function finite(v) {
        return typeof v === 'number' && Number.isFinite(v);
      };
      var uuid = function uuid(v) {
        return typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
      };
      var dayKey = function dayKey(v) {
        return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
      };
      var stages = ['classic', 'coconut_green', 'taro_boba', 'brown_sugar', 'mochi_special'];
      var reasons = ['CUP_FULL', 'SPILLED', 'BUDGET_EXHAUSTED', 'ABANDONED', 'TECHNICAL_ERROR'];
      var rulesVersions = ['design-v0.1', 'design-v0.2-short-cup-01', 'design-v0.3-cup-auto-01', 'design-v0.4-mobile-feel-ads-01', 'design-v0.5-natural-spawn-01'];
      var levels = function levels(v) {
        return integer(v, 1, 9);
      };
      var boards = function boards(v) {
        return v === 'standard' || v === 'assisted';
      };
      var common = ['saveSchemaVersion', 'rulesVersion', 'appVersion', 'runId', 'epoch', 'revision', 'stageId', 'mode', 'boardType', 'state', 'tick', 'nextEntityId', 'nextCommandSequence', 'score', 'maxLevel', 'dropIndex', 'currentLevel', 'nextLevel', 'lastDropTick', 'settleStartedTick', 'challenge', 'rng', 'ingredients', 'shake', 'dangerTicks', 'terminalReason', 'checksum'];

      /** Strict, exception-safe validation for data crossing the browser storage boundary. */
      var SaveValidator = exports('SaveValidator', /*#__PURE__*/function () {
        function SaveValidator() {}
        SaveValidator.envelope = function envelope(value) {
          try {
            if (!object(value) || !keys(value, ['schemaVersion', 'revision', 'payload', 'checksum']) || value.schemaVersion !== 2 || !integer(value.revision, 0) || typeof value.checksum !== 'string' || !/^[0-9a-f]{64}$/.test(value.checksum)) return false;
            var payload = this.bundle(value.payload);
            if (!payload.valid) return false;
            return SaveCodec.verifyEnvelopeV2(value);
          } catch (_unused) {
            return false;
          }
        }
        /** Schema-1 envelope (v2 runs / v1 profile) accepted only so the repository can migrate it. */;
        SaveValidator.legacyEnvelope = function legacyEnvelope(value) {
          try {
            if (!object(value) || !keys(value, ['schemaVersion', 'revision', 'payload', 'checksum']) || value.schemaVersion !== 1 || !integer(value.revision, 0) || typeof value.checksum !== 'string' || !/^[0-9a-f]{64}$/.test(value.checksum)) return false;
            var payload = this.legacyBundle(value.payload);
            if (!payload.valid) return false;
            return SaveCodec.verifyEnvelope(value);
          } catch (_unused2) {
            return false;
          }
        };
        SaveValidator.bundle = function bundle(value) {
          try {
            var _run$runId;
            if (!object(value) || !keys(value, ['profile', 'run', 'lastResult'])) return bad('SAVE_BUNDLE_INVALID', '档案结构无效');
            var profile = this.profile(value.profile);
            if (!profile.valid) return profile;
            if (value.run !== null) {
              var result = this.snapshot(value.run);
              if (!result.valid) return result;
            }
            var run = value.run;
            if (((_run$runId = run == null ? void 0 : run.runId) != null ? _run$runId : null) !== value.profile.activeRunId) return bad('SAVE_OWNER_MISMATCH', '活动局与玩家档案owner不一致');
            if (value.lastResult !== null) {
              var _result = value.lastResult;
              if (!object(_result) || !keys(_result, ['runId', 'reason', 'score', 'maxLevel', 'dropIndex', 'baseUsed', 'extraUsed', 'boardType', 'rulesVersion']) || !uuid(_result.runId) || !reasons.includes(_result.reason) || !integer(_result.score, 0) || !levels(_result.maxLevel) || !integer(_result.dropIndex, 0) || !integer(_result.baseUsed, 0, 2) || !integer(_result.extraUsed, 0, 5) || !boards(_result.boardType) || _result.extraUsed > 0 && _result.boardType !== 'assisted' || _result.rulesVersion !== undefined && typeof _result.rulesVersion !== 'string') return bad('SAVE_RESULT_INVALID', '结算摘要无效');
            }
            return ok();
          } catch (_unused3) {
            return bad('SAVE_BUNDLE_INVALID', '档案结构无效');
          }
        }
        /** Schema-1 payload shape; used by migration before it writes the current bundle. */;
        SaveValidator.legacyBundle = function legacyBundle(value) {
          try {
            var _run$runId2;
            if (!object(value) || !keys(value, ['profile', 'run', 'lastResult'])) return bad('SAVE_BUNDLE_INVALID', '档案结构无效');
            var profile = this.legacyProfile(value.profile);
            if (!profile.valid) return profile;
            if (value.run !== null) {
              var schema = value.run.saveSchemaVersion;
              if (schema !== 1 && schema !== 2 && schema !== 3) return bad('SAVE_RUN_HEADER', '旧版运行快照版本不支持');
              var result = this.legacySnapshot(value.run, schema);
              if (!result.valid) return result;
            }
            var run = value.run;
            if (((_run$runId2 = run == null ? void 0 : run.runId) != null ? _run$runId2 : null) !== value.profile.activeRunId) return bad('SAVE_OWNER_MISMATCH', '活动局与玩家档案owner不一致');
            if (value.lastResult !== null) {
              var _result2 = value.lastResult;
              if (!object(_result2) || !keys(_result2, ['runId', 'reason', 'score', 'maxLevel', 'dropIndex', 'baseUsed', 'extraUsed', 'rulesVersion']) || !uuid(_result2.runId) || !reasons.includes(_result2.reason) || !integer(_result2.score, 0) || !levels(_result2.maxLevel) || !integer(_result2.dropIndex, 0) || !integer(_result2.baseUsed, 0, 2) || _result2.extraUsed !== 0 || _result2.rulesVersion !== undefined && typeof _result2.rulesVersion !== 'string') return bad('SAVE_RESULT_INVALID', '结算摘要无效');
            }
            return ok();
          } catch (_unused4) {
            return bad('SAVE_BUNDLE_INVALID', '档案结构无效');
          }
        };
        SaveValidator.profileShape = function profileShape(value, schema) {
          try {
            var extra = schema === 1 ? [] : schema === 2 ? ['firstNaturalRunCompleted', 'rewardedShake'] : ['firstNaturalRunCompleted', 'rewardedShake', 'rewardedRevive'];
            if (!object(value) || !keys(value, ['schemaVersion', 'settings', 'discoveredLevels', 'unlockedStageIds', 'bestScores', 'activeRunId', 'revision', 'bestScoresByRules', 'tutorialRulesVersion'].concat(extra)) || value.schemaVersion !== schema || !integer(value.revision, 0)) return bad('SAVE_PROFILE_INVALID', '玩家档案字段无效');
            var s = value.settings;
            if (!object(s) || !keys(s, ['musicGain', 'sfxGain', 'reducedMotion', 'dropMode', 'tutorialCompleted']) || !finite(s.musicGain) || s.musicGain < 0 || s.musicGain > 1 || !finite(s.sfxGain) || s.sfxGain < 0 || s.sfxGain > 1 || typeof s.reducedMotion !== 'boolean' || !['drag_release', 'tap_confirm'].includes(String(s.dropMode)) || typeof s.tutorialCompleted !== 'boolean') return bad('SAVE_SETTINGS_INVALID', '设置字段无效');
            if (!Array.isArray(value.discoveredLevels) || value.discoveredLevels.some(function (x) {
              return !levels(x);
            }) || new Set(value.discoveredLevels).size !== value.discoveredLevels.length) return bad('SAVE_DISCOVERY_INVALID', '已发现等级无效');
            if (!Array.isArray(value.unlockedStageIds) || value.unlockedStageIds.length === 0 || value.unlockedStageIds.some(function (x) {
              return !stages.includes(x);
            }) || new Set(value.unlockedStageIds).size !== value.unlockedStageIds.length) return bad('SAVE_STAGE_INVALID', '解锁阶段无效');
            if (value.activeRunId !== null && !uuid(value.activeRunId)) return bad('SAVE_ACTIVE_RUN_INVALID', '活动局标识无效');
            if (!object(value.bestScores) || !keys(value.bestScores, stages)) return bad('SAVE_BEST_SCORES_INVALID', '最佳成绩结构无效');
            for (var _i = 0, _Object$keys = Object.keys(value.bestScores); _i < _Object$keys.length; _i++) {
              var stage = _Object$keys[_i];
              var best = value.bestScores[stage];
              if (!object(best) || !keys(best, ['standard', 'assisted']) || Object.values(best).some(function (score) {
                return !integer(score, 0);
              })) return bad('SAVE_BEST_SCORES_INVALID', '最佳成绩结构无效');
            }
            if (value.tutorialRulesVersion !== undefined && value.tutorialRulesVersion !== null && typeof value.tutorialRulesVersion !== 'string') return bad('SAVE_PROFILE_INVALID', '教程规则标识无效');
            if (schema >= 2) {
              if (typeof value.firstNaturalRunCompleted !== 'boolean') return bad('SAVE_PROFILE_INVALID', '自然首局完成标记无效');
              var ledger = value.rewardedShake;
              if (!object(ledger) || !keys(ledger, ['dayKey', 'dailyGranted', 'pendingAttempt', 'receipts']) || ledger.dayKey !== null && !dayKey(ledger.dayKey) || !integer(ledger.dailyGranted, 0, 365)) return bad('SAVE_REWARD_LEDGER_INVALID', '奖励账本字段无效');
              var pending = ledger.pendingAttempt;
              if (pending !== null && (!object(pending) || !keys(pending, ['attemptId', 'runId', 'policyVersion', 'amount', 'dayKey', 'startedAt']) || !uuid(pending.attemptId) || !uuid(pending.runId) || typeof pending.policyVersion !== 'string' || pending.policyVersion.length === 0 || pending.amount !== 1 || !dayKey(pending.dayKey) || !integer(pending.startedAt, 0))) return bad('SAVE_REWARD_LEDGER_INVALID', '待确认奖励记录无效');
              if (!Array.isArray(ledger.receipts) || ledger.receipts.length > 64) return bad('SAVE_REWARD_LEDGER_INVALID', '奖励凭证列表无效');
              var attempts = new Set();
              for (var _iterator = _createForOfIteratorHelperLoose(ledger.receipts), _step; !(_step = _iterator()).done;) {
                var _receipt = _step.value;
                if (!object(_receipt) || !keys(_receipt, ['attemptId', 'runId', 'rewardKind', 'amount', 'policyVersion', 'dayKey', 'status', 'grantedAt']) || !uuid(_receipt.attemptId) || attempts.has(_receipt.attemptId) || !uuid(_receipt.runId) || _receipt.rewardKind !== 'extra_shake' || _receipt.amount !== 1 || typeof _receipt.policyVersion !== 'string' || _receipt.policyVersion.length === 0 || !dayKey(_receipt.dayKey) || _receipt.status !== 'COMMITTED' || !integer(_receipt.grantedAt, 0)) return bad('SAVE_REWARD_LEDGER_INVALID', '奖励凭证无效');
                attempts.add(_receipt.attemptId);
              }
              if (schema === 3) {
                var revive = value.rewardedRevive;
                if (!object(revive) || !keys(revive, ['dayKey', 'dailyGranted', 'pendingAttempt', 'receipts']) || revive.dayKey !== null && !dayKey(revive.dayKey) || !integer(revive.dailyGranted, 0, 365)) return bad('SAVE_REWARD_LEDGER_INVALID', '复活奖励账本字段无效');
                var revivePending = revive.pendingAttempt;
                if (revivePending !== null && (!object(revivePending) || !keys(revivePending, ['attemptId', 'runId', 'failureId', 'policyVersion', 'amount', 'dayKey', 'startedAt']) || !uuid(revivePending.attemptId) || !uuid(revivePending.runId) || !uuid(revivePending.failureId) || typeof revivePending.policyVersion !== 'string' || revivePending.policyVersion.length === 0 || revivePending.amount !== 1 || !dayKey(revivePending.dayKey) || !integer(revivePending.startedAt, 0))) return bad('SAVE_REWARD_LEDGER_INVALID', '待确认复活记录无效');
                if (!Array.isArray(revive.receipts) || revive.receipts.length > 64) return bad('SAVE_REWARD_LEDGER_INVALID', '复活凭证列表无效');
                var reviveAttempts = new Set();
                for (var _iterator2 = _createForOfIteratorHelperLoose(revive.receipts), _step2; !(_step2 = _iterator2()).done;) {
                  var receipt = _step2.value;
                  if (!object(receipt) || !keys(receipt, ['attemptId', 'runId', 'failureId', 'rewardKind', 'amount', 'policyVersion', 'dayKey', 'status', 'grantedAt']) || !uuid(receipt.attemptId) || reviveAttempts.has(receipt.attemptId) || !uuid(receipt.runId) || !uuid(receipt.failureId) || receipt.rewardKind !== 'spill_revive' || receipt.amount !== 1 || typeof receipt.policyVersion !== 'string' || receipt.policyVersion.length === 0 || !dayKey(receipt.dayKey) || receipt.status !== 'COMMITTED' || !integer(receipt.grantedAt, 0)) return bad('SAVE_REWARD_LEDGER_INVALID', '复活凭证无效');
                  reviveAttempts.add(receipt.attemptId);
                }
              }
            }
            return ok();
          } catch (_unused5) {
            return bad('SAVE_PROFILE_INVALID', '玩家档案结构无效');
          }
        };
        SaveValidator.profile = function profile(value) {
          return this.profileShape(value, 3);
        };
        SaveValidator.profileV2 = function profileV2(value) {
          return this.profileShape(value, 2);
        };
        SaveValidator.legacyProfile = function legacyProfile(value) {
          return this.profileShape(value, 1);
        };
        SaveValidator.runCommon = function runCommon(value) {
          try {
            var s = value;
            if (!uuid(s.runId) || !integer(s.epoch, 0) || !integer(s.revision, 0)) return bad('SAVE_RUN_HEADER', '运行快照头无效或版本不兼容');
            if (!stages.includes(s.stageId) || s.mode !== 'classic' || !boards(s.boardType) || !['PLAYING', 'PAUSED', 'SETTLING', 'RESULTS'].includes(s.state)) return bad('SAVE_RULES_UNSUPPORTED', '本地经典档规则不兼容');
            if (!integer(s.tick, 0) || !integer(s.nextEntityId, 1) || !integer(s.nextCommandSequence, 1) || !integer(s.score, 0) || !levels(s.maxLevel) || !integer(s.dropIndex, 0) || !levels(s.currentLevel) || !levels(s.nextLevel)) return bad('SAVE_RUN_COUNTER', '运行计数无效');
            if (s.lastDropTick !== null && (!integer(s.lastDropTick, 0) || s.lastDropTick > s.tick) || s.settleStartedTick !== null && (!integer(s.settleStartedTick, 0) || s.settleStartedTick > s.tick)) return bad('SAVE_ID_OR_DROP_TICK', '实体ID或逻辑步无效');
            if (s.terminalReason !== null && !reasons.includes(s.terminalReason)) return bad('SAVE_TERMINAL_INVALID', '终局原因无效');
            if ((s.state === 'SETTLING' || s.state === 'RESULTS') && s.terminalReason === null || ['PLAYING', 'PAUSED'].includes(s.state) && s.terminalReason !== null) return bad('SAVE_TERMINAL_INVALID', '终局状态与原因不一致');
            if (s.challenge !== null) return bad('SAVE_RULES_UNSUPPORTED', '本地经典档不接受挑战状态');
            if (!object(s.rng) || !keys(s.rng, ['algorithm', 'state', 'drawCount']) || s.rng.algorithm !== 'xorshift32_v1_nonzero_seed' || !integer(s.rng.state, 1, 0xffffffff) || !integer(s.rng.drawCount, 0) || s.rng.drawCount !== s.dropIndex + 2) return bad('SAVE_RNG_INVALID', '随机流状态无效');
            if (!integer(s.dangerTicks, 0, 180) || !Array.isArray(s.ingredients)) return bad('SAVE_RULE_STATE_INVALID', '危险或实体列表无效');
            var ids = new Set();
            var maxId = 0;
            for (var _iterator3 = _createForOfIteratorHelperLoose(s.ingredients), _step3; !(_step3 = _iterator3()).done;) {
              var item = _step3.value;
              if (!object(item) || !keys(item, ['entityId', 'level', 'positionDu', 'velocityDuPerSecond', 'angleRadians', 'angularVelocity', 'bornTick', 'dangerEligible', 'hasEnteredCup', 'spillTicks', 'sleeping']) || !integer(item.entityId, 1) || ids.has(item.entityId) || !levels(item.level)) return bad('SAVE_ENTITY_ID', '实体ID或等级无效');
              ids.add(item.entityId);
              maxId = Math.max(maxId, item.entityId);
              for (var _i2 = 0, _arr = [item.positionDu, item.velocityDuPerSecond]; _i2 < _arr.length; _i2++) {
                var point = _arr[_i2];
                if (!object(point) || !keys(point, ['x', 'y']) || !finite(point.x) || !finite(point.y)) return bad('SAVE_ENTITY_NONFINITE', '实体向量字段无效');
              }
              if (!finite(item.angleRadians) || !finite(item.angularVelocity) || !integer(item.bornTick, 0, s.tick) || typeof item.dangerEligible !== 'boolean' || typeof item.hasEnteredCup !== 'boolean' || !integer(item.spillTicks, 0, 30) || typeof item.sleeping !== 'boolean') return bad('SAVE_ENTITY_LOGIC', '实体逻辑字段无效');
            }
            if (s.nextEntityId <= maxId || s.maxLevel < Math.max.apply(Math, [1].concat(s.ingredients.map(function (item) {
              return item.level;
            }))) || s.dropIndex === 0 !== (s.lastDropTick === null)) return bad('SAVE_ID_OR_DROP_TICK', 'ID、最高等级或投放步跨字段不一致');
            if (typeof s.checksum !== 'string' || !/^[0-9a-f]{64}$/.test(s.checksum) || !SaveCodec.verifySnapshot(s)) return bad('SAVE_RUN_CHECKSUM', '运行快照checksum缺失或不匹配');
            return ok();
          } catch (_unused6) {
            return bad('SAVE_RUN_INVALID', '运行快照结构无效');
          }
        };
        SaveValidator.motionAndAuto = function motionAndAuto(value, s) {
          var motion = value.cupMotion,
            automatic = value.autoDrop;
          if (!object(motion) || !keys(motion, ['offsetXDu', 'velocityXDuPerSecond', 'targetOffsetXDu', 'control']) || !finite(motion.offsetXDu) || Math.abs(motion.offsetXDu) > 110 || !finite(motion.velocityXDuPerSecond) || Math.abs(motion.velocityXDuPerSecond) > 1200 || !finite(motion.targetOffsetXDu) || Math.abs(motion.targetOffsetXDu) > 110 || !['IDLE', 'DRAGGING', 'SETTLING'].includes(String(motion.control)) || !object(automatic) || !(keys(automatic, ['nextDueTick']) || keys(automatic, ['nextDueTick', 'pendingSpawn'])) || !integer(automatic.nextDueTick, 0)) return bad('SAVE_CUP_AUTO_INVALID', '移杯或自动落料状态无效');
          return ok();
        };
        SaveValidator.snapshot = function snapshot(value) {
          try {
            if (!object(value)) return bad('SAVE_RUN_HEADER', '运行快照结构无效');
            if (!keys(value, [].concat(common, ['cupMotion', 'autoDrop', 'spawnRng', 'revive'])) || value.saveSchemaVersion !== 5 || !rulesVersions.includes(String(value.rulesVersion)) || value.appVersion !== '0.1.0') return bad('SAVE_RUN_HEADER', '运行快照头无效或版本不兼容');
            var s = value,
              shake = s.shake;
            if (!object(shake) || !keys(shake, ['baseUsed', 'extraGranted', 'extraUsed', 'activeStartTick', 'cooldownUntilTick']) || !integer(shake.baseUsed, 0, 2) || !integer(shake.extraGranted, 0, 5) || !integer(shake.extraUsed, 0, 5) || shake.extraUsed > shake.extraGranted || shake.activeStartTick !== null && !integer(shake.activeStartTick, 0, s.tick) || !integer(shake.cooldownUntilTick, 0)) return bad('SAVE_RULE_STATE_INVALID', '危险或晃杯状态越界');
            var revive = s.revive,
              expectedAssisted = shake.extraUsed > 0 || (revive == null ? void 0 : revive.used) === 1;
            if (!object(revive) || !keys(revive, ['used', 'pendingFailure', 'committedReceiptId']) || integer(revive.used, 0, 1) === false) return bad('SAVE_RULE_STATE_INVALID', '复活账本无效');
            if (revive.pendingFailure !== null) {
              var p = revive.pendingFailure;
              if (!object(p) || !keys(p, ['version', 'failureId', 'detectedTick', 'reason', 'spilledEntityIds', 'clearanceDu', 'candidateHash', 'retainedEntityIds']) || p.version !== 1 || p.reason !== 'SPILLED' || !uuid(p.failureId) || !integer(p.detectedTick, 0, s.tick) || !Array.isArray(p.spilledEntityIds) || !Array.isArray(p.retainedEntityIds) || p.retainedEntityIds.some(function (x) {
                return !integer(x, 1);
              }) || !integer(p.clearanceDu, 0, 200) || typeof p.candidateHash !== 'string' || !/^[0-9a-f]{64}$/.test(p.candidateHash) || s.state !== 'PAUSED' || s.terminalReason !== null) return bad('SAVE_RULE_STATE_INVALID', '待复活数据无效');
            } else if (revive.committedReceiptId !== null && !uuid(revive.committedReceiptId)) return bad('SAVE_RULE_STATE_INVALID', '复活凭证无效');
            if (expectedAssisted && s.boardType !== 'assisted' || !expectedAssisted && s.boardType === 'assisted') return bad('SAVE_RULE_STATE_INVALID', '辅助局与奖励计数不一致');
            var base = this.runCommon(value);
            if (!base.valid) return base;
            if (!object(value.spawnRng) || !keys(value.spawnRng, ['algorithm', 'state', 'drawCount']) || value.spawnRng.algorithm !== 'spawn-xorshift32-v1' || !integer(value.spawnRng.state, 1, 0xffffffff) || !integer(value.spawnRng.drawCount, 0, Number.MAX_SAFE_INTEGER) || !object(value.autoDrop) || !keys(value.autoDrop, ['nextDueTick', 'pendingSpawn'])) return bad('SAVE_SPAWN_INVALID', '自然落料随机流状态无效');
            var motion = this.motionAndAuto(value, s);
            if (!motion.valid) return motion;
            var pending = value.autoDrop.pendingSpawn;
            if (!object(pending) || !keys(pending, ['level', 'xDu', 'vxDuPerSecond', 'angularVelocity']) || !levels(pending.level) || pending.level !== s.currentLevel || !finite(pending.xDu) || Math.abs(pending.xDu - 375) > 20 || !finite(pending.vxDuPerSecond) || Math.abs(pending.vxDuPerSecond) > 12 || pending.angularVelocity !== 0) return bad('SAVE_SPAWN_INVALID', '待落料描述符无效');
            return ok();
          } catch (_unused7) {
            return bad('SAVE_RUN_INVALID', '运行快照结构无效');
          }
        }
        /** Schema-4 run snapshot accepted only as migration input (pre-spill-revive saves). */;
        SaveValidator.legacySnapshotV4 = function legacySnapshotV4(value) {
          try {
            if (!object(value)) return bad('SAVE_RUN_HEADER', '运行快照结构无效');
            if (!keys(value, [].concat(common, ['cupMotion', 'autoDrop', 'spawnRng'])) || value.saveSchemaVersion !== 4 || !rulesVersions.includes(String(value.rulesVersion)) || value.appVersion !== '0.1.0') return bad('SAVE_RUN_HEADER', '运行快照头无效或版本不兼容');
            var s = value,
              shake = s.shake;
            if (!object(shake) || !keys(shake, ['baseUsed', 'extraGranted', 'extraUsed', 'activeStartTick', 'cooldownUntilTick']) || !integer(shake.baseUsed, 0, 2) || !integer(shake.extraGranted, 0, 5) || !integer(shake.extraUsed, 0, 5) || shake.extraUsed > shake.extraGranted || shake.activeStartTick !== null && !integer(shake.activeStartTick, 0, s.tick) || !integer(shake.cooldownUntilTick, 0)) return bad('SAVE_RULE_STATE_INVALID', '危险或晃杯状态越界');
            if (shake.extraUsed > 0 && s.boardType !== 'assisted' || shake.extraUsed === 0 && s.boardType === 'assisted') return bad('SAVE_RULE_STATE_INVALID', '辅助局与额外晃杯计数不一致');
            var base = this.runCommon(value);
            if (!base.valid) return base;
            if (!object(value.spawnRng) || !keys(value.spawnRng, ['algorithm', 'state', 'drawCount']) || value.spawnRng.algorithm !== 'spawn-xorshift32-v1' || !integer(value.spawnRng.state, 1, 0xffffffff) || !integer(value.spawnRng.drawCount, 0, Number.MAX_SAFE_INTEGER) || !object(value.autoDrop) || !keys(value.autoDrop, ['nextDueTick', 'pendingSpawn'])) return bad('SAVE_SPAWN_INVALID', '自然落料随机流状态无效');
            var motion = this.motionAndAuto(value, s);
            if (!motion.valid) return motion;
            return ok();
          } catch (_unused8) {
            return bad('SAVE_RUN_INVALID', '运行快照结构无效');
          }
        };
        SaveValidator.legacySnapshot = function legacySnapshot(value, schema) {
          try {
            if (!object(value)) return bad('SAVE_RUN_HEADER', '运行快照结构无效');
            var allowed = schema === 1 ? common : [].concat(common, ['cupMotion', 'autoDrop']);
            if (!keys(value, allowed) || value.saveSchemaVersion !== schema || !rulesVersions.includes(String(value.rulesVersion)) || value.appVersion !== '0.1.0') return bad('SAVE_RUN_HEADER', '运行快照头无效或版本不兼容');
            var s = value,
              shake = s.shake;
            if (!object(shake) || !keys(shake, ['baseUsed', 'extraUsed', 'activeStartTick', 'cooldownUntilTick']) || !integer(shake.baseUsed, 0, 2) || shake.extraUsed !== 0 || s.boardType !== 'standard' || shake.activeStartTick !== null && !integer(shake.activeStartTick, 0, s.tick) || !integer(shake.cooldownUntilTick, 0)) return bad('SAVE_RULE_STATE_INVALID', '危险或晃杯状态越界');
            var base = this.runCommon(value);
            if (!base.valid) return base;
            if (schema >= 2) {
              var motion = this.motionAndAuto(value, s);
              if (!motion.valid) return motion;
            }
            return ok();
          } catch (_unused9) {
            return bad('SAVE_RUN_INVALID', '运行快照结构无效');
          }
        };
        return SaveValidator;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/Sha256.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      exports({
        sha256Bytes: sha256Bytes,
        sha256Utf8: sha256Utf8
      });
      cclegacy._RF.push({}, "a9a80Siu9RA2pagiN8Sc3UQ", "Sha256", undefined);
      var K = new Uint32Array([0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2]);
      var rotr = function rotr(x, n) {
        return x >>> n | x << 32 - n;
      };
      function sha256Bytes(input) {
        var bitLength = input.length * 8;
        var paddedLength = Math.ceil((input.length + 9) / 64) * 64;
        var bytes = new Uint8Array(paddedLength);
        bytes.set(input);
        bytes[input.length] = 0x80;
        var view = new DataView(bytes.buffer);
        view.setUint32(paddedLength - 8, Math.floor(bitLength / 0x100000000), false);
        view.setUint32(paddedLength - 4, bitLength >>> 0, false);
        var h = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);
        var w = new Uint32Array(64);
        for (var offset = 0; offset < paddedLength; offset += 64) {
          for (var i = 0; i < 16; i++) w[i] = view.getUint32(offset + i * 4, false);
          for (var _i = 16; _i < 64; _i++) {
            var _a = w[_i - 15],
              _b = w[_i - 2];
            var s0 = rotr(_a, 7) ^ rotr(_a, 18) ^ _a >>> 3,
              s1 = rotr(_b, 17) ^ rotr(_b, 19) ^ _b >>> 10;
            w[_i] = w[_i - 16] + s0 + w[_i - 7] + s1 >>> 0;
          }
          var _Array$from = Array.from(h),
            a = _Array$from[0],
            b = _Array$from[1],
            c = _Array$from[2],
            d = _Array$from[3],
            e = _Array$from[4],
            f = _Array$from[5],
            g = _Array$from[6],
            hh = _Array$from[7];
          for (var _i2 = 0; _i2 < 64; _i2++) {
            var S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25),
              ch = e & f ^ ~e & g,
              t1 = hh + S1 + ch + K[_i2] + w[_i2] >>> 0;
            var S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22),
              maj = a & b ^ a & c ^ b & c,
              t2 = S0 + maj >>> 0;
            hh = g;
            g = f;
            f = e;
            e = d + t1 >>> 0;
            d = c;
            c = b;
            b = a;
            a = t1 + t2 >>> 0;
          }
          h[0] = h[0] + a >>> 0;
          h[1] = h[1] + b >>> 0;
          h[2] = h[2] + c >>> 0;
          h[3] = h[3] + d >>> 0;
          h[4] = h[4] + e >>> 0;
          h[5] = h[5] + f >>> 0;
          h[6] = h[6] + g >>> 0;
          h[7] = h[7] + hh >>> 0;
        }
        return Array.from(h, function (value) {
          return value.toString(16).padStart(8, '0');
        }).join('');
      }
      function sha256Utf8(value) {
        return sha256Bytes(new TextEncoder().encode(value));
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/SpawnRng.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      cclegacy._RF.push({}, "004154WL5lGVpJimG2GSWTi", "SpawnRng", undefined);
      /** Independent deterministic stream for physical spawn jitter. */
      var SpawnRng = exports('SpawnRng', /*#__PURE__*/function () {
        function SpawnRng(seed, state, drawCount) {
          if (drawCount === void 0) {
            drawCount = 0;
          }
          this.state = void 0;
          this.draws = void 0;
          this.state = (state != null ? state : SpawnRng.seed(seed)) >>> 0;
          if (!this.state) throw new Error('SPAWN_RNG_ZERO');
          this.draws = drawCount;
        }
        SpawnRng.seed = function seed(_seed) {
          var x = (_seed ^ 0x9e3779b9) >>> 0;
          x = (x ^ x >>> 16) >>> 0;
          x = Math.imul(x, 0x7feb352d) >>> 0;
          x = (x ^ x >>> 15) >>> 0;
          x = Math.imul(x, 0x846ca68b) >>> 0;
          x = (x ^ x >>> 16) >>> 0;
          return x || 0x6d2b79f5;
        };
        var _proto = SpawnRng.prototype;
        _proto.nextIndex = function nextIndex(length) {
          var x = this.state;
          x ^= x << 13;
          x ^= x >>> 17;
          x ^= x << 5;
          this.state = x >>> 0;
          this.draws++;
          return Math.floor(this.state / 0x100000000 * length);
        };
        _proto.snapshot = function snapshot() {
          return {
            algorithm: 'spawn-xorshift32-v1',
            state: this.state,
            drawCount: this.draws
          };
        };
        return SpawnRng;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/SpillRevivePolicyLoader.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      cclegacy._RF.push({}, "bc171rOcylDbb5GcixkWOjf", "SpillRevivePolicyLoader", undefined);
      /** Validates the runtime spill-revive policy. Any malformed file or missing ad unit keeps the placement closed. */
      var SpillRevivePolicyLoader = exports('SpillRevivePolicyLoader', /*#__PURE__*/function () {
        function SpillRevivePolicyLoader() {}
        SpillRevivePolicyLoader.validate = function validate(raw) {
          try {
            if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('洒出复活策略必须是对象');
            var p = raw;
            if (typeof p.policyVersion !== 'string' || !p.policyVersion.trim()) throw new Error('policyVersion 缺失');
            if (typeof p.enabled !== 'boolean') throw new Error('enabled 必须是 boolean');
            if (p.adUnitId !== null && (typeof p.adUnitId !== 'string' || !p.adUnitId.trim())) throw new Error('adUnitId 必须是 null 或非空字符串');
            if (p.placement !== 'spill-revive') throw new Error('placement 必须为 spill-revive');
            var amount = function amount(key, min, max) {
              var value = p[key];
              if (!Number.isSafeInteger(value) || Number(value) < min || Number(value) > max) throw new Error(key + " \u5FC5\u987B\u662F " + min + ".." + max + " \u7684\u6574\u6570");
              return Number(value);
            };
            if (p.maxRevivesPerRun !== 1) throw new Error('maxRevivesPerRun 必须为 1');
            var maxDaily = amount('maxDailyRevives', 1, 3);
            var clearanceDu = amount('clearanceDu', 8, 120);
            var autoDropDelayTicks = amount('autoDropDelayTicks', 0, 240);
            var foreground = amount('minForegroundSecondsFirstSession', 0, 600);
            if (typeof p.requireTutorialComplete !== 'boolean' || typeof p.requireFirstNaturalRunCompleted !== 'boolean') throw new Error('资格开关必须是 boolean');
            var policy = {
              enabled: p.enabled,
              policyVersion: p.policyVersion,
              adUnitId: p.adUnitId,
              placement: 'spill-revive',
              maxRevivesPerRun: 1,
              maxDailyRevives: maxDaily,
              clearanceDu: clearanceDu,
              autoDropDelayTicks: autoDropDelayTicks,
              minForegroundSecondsFirstSession: foreground,
              requireTutorialComplete: p.requireTutorialComplete,
              requireFirstNaturalRunCompleted: p.requireFirstNaturalRunCompleted
            };
            return {
              ok: true,
              data: Object.freeze(policy)
            };
          } catch (error) {
            return {
              ok: false,
              error: {
                code: 'REVIVE_POLICY_INVALID',
                message: error instanceof Error ? error.message : String(error),
                retryable: false
              }
            };
          }
        };
        return SpillRevivePolicyLoader;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/SpillReviveService.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './ReviveLedger.ts', './RewardedAdCoordinator.ts'], function (exports) {
  var _createClass, _asyncToGenerator, _regeneratorRuntime, _extends, cclegacy, ReviveLedger, RewardedAdCoordinator;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
      _asyncToGenerator = module.asyncToGenerator;
      _regeneratorRuntime = module.regeneratorRuntime;
      _extends = module.extends;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      ReviveLedger = module.ReviveLedger;
    }, function (module) {
      RewardedAdCoordinator = module.RewardedAdCoordinator;
    }],
    execute: function () {
      cclegacy._RF.push({}, "4d2f8sXbJVKA7jnGpD108Ju", "SpillReviveService", undefined);
      var copy = function copy(value) {
        return JSON.parse(JSON.stringify(value));
      };
      function makeUuid() {
        var cryptoApi = globalThis.crypto;
        if (cryptoApi != null && cryptoApi.randomUUID) return cryptoApi.randomUUID();
        var bytes = new Uint8Array(16);
        if (cryptoApi != null && cryptoApi.getRandomValues) cryptoApi.getRandomValues(bytes);else for (var i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
        bytes[6] = bytes[6] & 15 | 64;
        bytes[8] = bytes[8] & 63 | 128;
        var hex = Array.from(bytes, function (value) {
          return value.toString(16).padStart(2, '0');
        }).join('');
        return hex.slice(0, 8) + "-" + hex.slice(8, 12) + "-" + hex.slice(12, 16) + "-" + hex.slice(16, 20) + "-" + hex.slice(20);
      }

      /**
       * Once-per-run spill revive. The pending attempt is durable before the ad is shown, and the receipt plus
       * the cleaned run snapshot are committed atomically before the live engine is revived.
       */
      var SpillReviveService = exports('SpillReviveService', /*#__PURE__*/function () {
        function SpillReviveService(env, repo, now) {
          this.phase = 'IDLE';
          this.message = null;
          this.retrySettle = false;
          this.busy = false;
          this.stalePending = false;
          this.pendingAttempt = null;
          this.trustedCompletionAttempt = null;
          this.foregroundSeconds = 0;
          this.host = null;
          this.boundRunId = null;
          this.hostGeneration = 0;
          this.env = env;
          this.repo = repo;
          this.now = now;
        }
        SpillReviveService.create = function create(env, repo, now) {
          if (now === void 0) {
            now = function now() {
              return Date.now();
            };
          }
          var service = new SpillReviveService(env, repo, now);
          var scope = globalThis;
          if (scope.__milkteaSpillRevive) {
            service.env.provider.dispose();
            return scope.__milkteaSpillRevive;
          }
          scope.__milkteaSpillRevive = service;
          return service;
        };
        var _proto = SpillReviveService.prototype;
        _proto.bind = function bind(host) {
          var _host$getActiveRunSna, _host$getActiveRunSna2, _host$getBundle;
          var nextRun = (_host$getActiveRunSna = (_host$getActiveRunSna2 = host.getActiveRunSnapshot()) == null ? void 0 : _host$getActiveRunSna2.runId) != null ? _host$getActiveRunSna : null;
          if (this.host !== host || this.boundRunId !== nextRun) {
            this.hostGeneration++;
            this.boundRunId = nextRun;
          }
          this.host = host;
          var ledger = (_host$getBundle = host.getBundle()) == null ? void 0 : _host$getBundle.profile.rewardedRevive;
          var run = host.getActiveRunSnapshot();
          this.stalePending = !!(ledger != null && ledger.pendingAttempt && run && ledger.pendingAttempt.runId === run.runId);
          if (!this.busy) {
            this.phase = 'IDLE';
            this.message = this.stalePending ? '上次复活广告未得到可信完成确认，未发放。' : null;
            this.retrySettle = false;
          }
        };
        _proto.unbind = function unbind(host) {
          if (this.host === host) this.host = null;
        };
        _proto.setForegroundSeconds = function setForegroundSeconds(seconds) {
          this.foregroundSeconds = Math.max(0, seconds);
        };
        _proto.dispose = function dispose() {
          this.env.provider.dispose();
        };
        _proto.getView = function getView() {
          var _this$host$getBundle, _this$host, _this$host$getActiveR, _this$host2, _this$host$isTutorial, _this$host3, _bundle$profile$rewar, _run$revive$used, _run$runId;
          var bundle = (_this$host$getBundle = (_this$host = this.host) == null ? void 0 : _this$host.getBundle()) != null ? _this$host$getBundle : null;
          var run = (_this$host$getActiveR = (_this$host2 = this.host) == null ? void 0 : _this$host2.getActiveRunSnapshot()) != null ? _this$host$getActiveR : null;
          var check = bundle ? ReviveLedger.checkOffer({
            policy: this.env.policy,
            capability: this.env.provider.capability(),
            profile: bundle.profile,
            run: run,
            foregroundSeconds: this.foregroundSeconds,
            tutorialComplete: (_this$host$isTutorial = (_this$host3 = this.host) == null ? void 0 : _this$host3.isTutorialComplete()) != null ? _this$host$isTutorial : false,
            nowMs: this.now()
          }) : {
            allowed: false,
            block: 'NO_ACTIVE_RUN'
          };
          var ledger = (_bundle$profile$rewar = bundle == null ? void 0 : bundle.profile.rewardedRevive) != null ? _bundle$profile$rewar : ReviveLedger.EMPTY;
          return {
            phase: this.phase,
            block: this.stalePending ? 'PENDING_ATTEMPT' : check.block,
            message: this.message,
            retrySettle: this.retrySettle,
            capability: this.env.provider.capability(),
            providerName: this.env.provider.providerName,
            usedThisRun: (_run$revive$used = run == null ? void 0 : run.revive.used) != null ? _run$revive$used : 0,
            dailyRemaining: ReviveLedger.dailyRemaining(ledger, this.env.policy, ReviveLedger.dayKey(this.now())),
            pendingAttempt: this.stalePending || !!(ledger.pendingAttempt && run && ledger.pendingAttempt.runId === run.runId),
            simulated: this.env.provider.providerName !== 'tap',
            blockingRunId: this.stalePending ? (_run$runId = run == null ? void 0 : run.runId) != null ? _run$runId : null : null
          };
        };
        _proto.canOffer = function canOffer() {
          var view = this.getView();
          return view.phase === 'IDLE' && view.block === null;
        };
        _proto.openOffer = function openOffer() {
          if (!this.host || this.busy) return;
          var check = this.check();
          if (!check.allowed) {
            this.message = this.blockMessage(check.block);
            this.changed();
            return;
          }
          this.phase = 'OFFER';
          this.message = null;
          this.retrySettle = false;
          this.host.pauseForRewardedAd();
          this.changed();
        }
        /** Close the offer and settle the frozen run as a normal SPILLED result. */;
        _proto.closeOffer = function closeOffer() {
          if (!this.host || this.phase !== 'OFFER' && this.phase !== 'ERROR') return;
          this.phase = 'IDLE';
          this.message = null;
          this.retrySettle = false;
          this.host.declineSpillRevive();
          this.changed();
        };
        _proto.watch = /*#__PURE__*/function () {
          var _watch = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
            var check, owner, generation, _owner$getBundle$prof, _owner$getBundle, _bundle, run, attemptId, dayKey, pending, frozen, pendingCommit, prepared, outcome;
            return _regeneratorRuntime().wrap(function _callee$(_context) {
              while (1) switch (_context.prev = _context.next) {
                case 0:
                  if (!(!this.host || this.phase !== 'OFFER' || this.busy)) {
                    _context.next = 2;
                    break;
                  }
                  return _context.abrupt("return");
                case 2:
                  check = this.check();
                  if (check.allowed) {
                    _context.next = 7;
                    break;
                  }
                  this.message = this.blockMessage(check.block);
                  this.changed();
                  return _context.abrupt("return");
                case 7:
                  if (RewardedAdCoordinator.claim('spill-revive')) {
                    _context.next = 12;
                    break;
                  }
                  this.message = '另有广告正在进行，请稍后再试。';
                  this.phase = 'ERROR';
                  this.changed();
                  return _context.abrupt("return");
                case 12:
                  owner = this.host, generation = this.hostGeneration;
                  this.busy = true;
                  this.phase = 'PREPARING';
                  this.message = null;
                  this.changed();
                  _context.prev = 17;
                  _context.next = 20;
                  return this.host.waitForSaveIdle();
                case 20:
                  if (!(this.host !== owner || generation !== this.hostGeneration)) {
                    _context.next = 22;
                    break;
                  }
                  throw new Error('REVIVE_ATTEMPT_OWNER_CHANGED');
                case 22:
                  _bundle = owner.getBundle();
                  run = owner.getActiveRunSnapshot();
                  if (!(!_bundle || !(run != null && run.revive.pendingFailure))) {
                    _context.next = 26;
                    break;
                  }
                  throw new Error('REVIVE_ATTEMPT_RUN_MISSING');
                case 26:
                  if (!(this.env.provider.capability() !== 'SUPPORTED')) {
                    _context.next = 28;
                    break;
                  }
                  throw new Error('REVIVE_AD_UNSUPPORTED');
                case 28:
                  attemptId = makeUuid();
                  dayKey = ReviveLedger.dayKey(this.now());
                  pending = {
                    attemptId: attemptId,
                    runId: run.runId,
                    failureId: run.revive.pendingFailure.failureId,
                    policyVersion: this.env.policy.policyVersion,
                    amount: 1,
                    dayKey: dayKey,
                    startedAt: this.now()
                  };
                  frozen = copy(_bundle);
                  frozen.run = copy(run);
                  frozen.profile.rewardedRevive = _extends({}, ReviveLedger.normalize(frozen.profile.rewardedRevive, dayKey), {
                    pendingAttempt: pending
                  });
                  _context.next = 36;
                  return this.repo.commitBundle(owner.getSaveRevision(), (_owner$getBundle$prof = (_owner$getBundle = owner.getBundle()) == null ? void 0 : _owner$getBundle.profile.activeRunId) != null ? _owner$getBundle$prof : run.runId, frozen);
                case 36:
                  pendingCommit = _context.sent;
                  if (!(this.host !== owner || generation !== this.hostGeneration)) {
                    _context.next = 39;
                    break;
                  }
                  throw new Error('REVIVE_ATTEMPT_OWNER_CHANGED');
                case 39:
                  if (pendingCommit.ok) {
                    _context.next = 45;
                    break;
                  }
                  this.busy = false;
                  this.phase = 'ERROR';
                  this.message = '无法写入待确认的复活记录，广告未展示。';
                  this.changed();
                  return _context.abrupt("return");
                case 45:
                  owner.onSpillReviveCommitted(frozen, pendingCommit.data.revision);
                  this.pendingAttempt = attemptId;
                  this.trustedCompletionAttempt = null;
                  _context.next = 50;
                  return this.env.provider.prepare();
                case 50:
                  prepared = _context.sent;
                  if (!(this.host !== owner || generation !== this.hostGeneration)) {
                    _context.next = 53;
                    break;
                  }
                  throw new Error('REVIVE_ATTEMPT_OWNER_CHANGED');
                case 53:
                  if (prepared.ok) {
                    _context.next = 60;
                    break;
                  }
                  _context.next = 56;
                  return this.clearPending('复活广告暂时无法加载，未发放奖励。');
                case 56:
                  if (_context.sent) {
                    _context.next = 58;
                    break;
                  }
                  throw new Error('REVIVE_PENDING_CLEAR_FAILED');
                case 58:
                  this.busy = false;
                  return _context.abrupt("return");
                case 60:
                  this.phase = 'SHOWING';
                  this.changed();
                  _context.next = 64;
                  return this.env.provider.show(attemptId);
                case 64:
                  outcome = _context.sent;
                  if (!(this.host !== owner || generation !== this.hostGeneration)) {
                    _context.next = 68;
                    break;
                  }
                  this.busy = false;
                  return _context.abrupt("return");
                case 68:
                  if (!(outcome.kind !== 'COMPLETED')) {
                    _context.next = 75;
                    break;
                  }
                  _context.next = 71;
                  return this.clearPending(outcome.kind === 'CANCELLED' ? '观看未完成，未发放复活。' : '广告播放失败，未发放复活。');
                case 71:
                  if (_context.sent) {
                    _context.next = 73;
                    break;
                  }
                  throw new Error('REVIVE_PENDING_CLEAR_FAILED');
                case 73:
                  this.busy = false;
                  return _context.abrupt("return");
                case 75:
                  this.trustedCompletionAttempt = attemptId;
                  this.phase = 'SETTLING';
                  this.changed();
                  _context.next = 80;
                  return this.settle(attemptId);
                case 80:
                  this.busy = false;
                  _context.next = 86;
                  break;
                case 83:
                  _context.prev = 83;
                  _context.t0 = _context["catch"](17);
                  if (this.host === owner && generation === this.hostGeneration) {
                    this.phase = 'ERROR';
                    this.retrySettle = !!this.pendingAttempt && this.trustedCompletionAttempt === this.pendingAttempt;
                    this.message = '复活广告流程暂时未完成；存档保持待确认状态，可重试或放弃。';
                    this.changed();
                  }
                case 86:
                  _context.prev = 86;
                  if (this.phase !== 'SHOWING') this.busy = false;
                  RewardedAdCoordinator.release('spill-revive');
                  return _context.finish(86);
                case 90:
                case "end":
                  return _context.stop();
              }
            }, _callee, this, [[17, 83, 86, 90]]);
          }));
          function watch() {
            return _watch.apply(this, arguments);
          }
          return watch;
        }();
        _proto.retrySettlement = /*#__PURE__*/function () {
          var _retrySettlement = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2() {
            return _regeneratorRuntime().wrap(function _callee2$(_context2) {
              while (1) switch (_context2.prev = _context2.next) {
                case 0:
                  if (!(!this.host || this.busy || !this.pendingAttempt || this.trustedCompletionAttempt !== this.pendingAttempt)) {
                    _context2.next = 2;
                    break;
                  }
                  return _context2.abrupt("return");
                case 2:
                  this.busy = true;
                  this.phase = 'SETTLING';
                  this.message = null;
                  this.changed();
                  _context2.prev = 6;
                  _context2.next = 9;
                  return this.settle(this.pendingAttempt);
                case 9:
                  _context2.next = 17;
                  break;
                case 11:
                  _context2.prev = 11;
                  _context2.t0 = _context2["catch"](6);
                  this.phase = 'ERROR';
                  this.retrySettle = true;
                  this.message = '复活保存仍未完成，可稍后重试。';
                  this.changed();
                case 17:
                  _context2.prev = 17;
                  this.busy = false;
                  return _context2.finish(17);
                case 20:
                case "end":
                  return _context2.stop();
              }
            }, _callee2, this, [[6, 11, 17, 20]]);
          }));
          function retrySettlement() {
            return _retrySettlement.apply(this, arguments);
          }
          return retrySettlement;
        }();
        _proto.abandonPending = /*#__PURE__*/function () {
          var _abandonPending = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee3() {
            var cleared;
            return _regeneratorRuntime().wrap(function _callee3$(_context3) {
              while (1) switch (_context3.prev = _context3.next) {
                case 0:
                  if (!(!this.host || this.busy)) {
                    _context3.next = 2;
                    break;
                  }
                  return _context3.abrupt("return");
                case 2:
                  this.busy = true;
                  _context3.next = 5;
                  return this.clearPending('已放弃未确认的复活奖励。', false);
                case 5:
                  cleared = _context3.sent;
                  if (cleared) {
                    _context3.next = 12;
                    break;
                  }
                  this.busy = false;
                  this.phase = 'ERROR';
                  this.message = '放弃操作未能保存，请重试。';
                  this.changed();
                  return _context3.abrupt("return");
                case 12:
                  this.stalePending = false;
                  this.pendingAttempt = null;
                  this.trustedCompletionAttempt = null;
                  this.retrySettle = false;
                  this.busy = false;
                  this.host.declineSpillRevive();
                  this.changed();
                case 19:
                case "end":
                  return _context3.stop();
              }
            }, _callee3, this);
          }));
          function abandonPending() {
            return _abandonPending.apply(this, arguments);
          }
          return abandonPending;
        }();
        _proto.acknowledgeGrant = function acknowledgeGrant() {
          if (!this.host || this.phase !== 'GRANTED') return;
          this.phase = 'IDLE';
          this.message = null;
          this.changed();
          this.host.resumeFromRewardedAd('本局已复活，点击继续。');
        };
        _proto.check = function check() {
          var _this$host$getBundle2, _this$host4, _this$host$getActiveR2, _this$host5, _this$host$isTutorial2, _this$host6;
          var bundle = (_this$host$getBundle2 = (_this$host4 = this.host) == null ? void 0 : _this$host4.getBundle()) != null ? _this$host$getBundle2 : null;
          var run = (_this$host$getActiveR2 = (_this$host5 = this.host) == null ? void 0 : _this$host5.getActiveRunSnapshot()) != null ? _this$host$getActiveR2 : null;
          if (!bundle || !run) return {
            allowed: false,
            block: 'NO_ACTIVE_RUN'
          };
          return ReviveLedger.checkOffer({
            policy: this.env.policy,
            capability: this.env.provider.capability(),
            profile: bundle.profile,
            run: run,
            foregroundSeconds: this.foregroundSeconds,
            tutorialComplete: (_this$host$isTutorial2 = (_this$host6 = this.host) == null ? void 0 : _this$host6.isTutorialComplete()) != null ? _this$host$isTutorial2 : false,
            nowMs: this.now()
          });
        };
        _proto.clearPending = /*#__PURE__*/function () {
          var _clearPending = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee4(message, resume) {
            var owner, generation, bundle, next, committed;
            return _regeneratorRuntime().wrap(function _callee4$(_context4) {
              while (1) switch (_context4.prev = _context4.next) {
                case 0:
                  if (resume === void 0) {
                    resume = true;
                  }
                  owner = this.host, generation = this.hostGeneration;
                  if (owner) {
                    _context4.next = 4;
                    break;
                  }
                  return _context4.abrupt("return", false);
                case 4:
                  bundle = owner.getBundle();
                  if (!bundle) {
                    _context4.next = 14;
                    break;
                  }
                  next = copy(bundle);
                  next.profile.rewardedRevive = ReviveLedger.clearPending(next.profile.rewardedRevive);
                  _context4.next = 10;
                  return this.repo.commitBundle(owner.getSaveRevision(), bundle.profile.activeRunId, next);
                case 10:
                  committed = _context4.sent;
                  if (!(this.host !== owner || generation !== this.hostGeneration || !committed.ok)) {
                    _context4.next = 13;
                    break;
                  }
                  return _context4.abrupt("return", false);
                case 13:
                  owner.onSpillReviveCommitted(next, committed.data.revision);
                case 14:
                  this.pendingAttempt = null;
                  this.phase = 'ERROR';
                  this.retrySettle = false;
                  this.message = message;
                  this.changed();
                  this.trustedCompletionAttempt = null;
                  if (resume) {
                    owner.declineSpillRevive();
                  }
                  return _context4.abrupt("return", true);
                case 22:
                case "end":
                  return _context4.stop();
              }
            }, _callee4, this);
          }));
          function clearPending(_x, _x2) {
            return _clearPending.apply(this, arguments);
          }
          return clearPending;
        }();
        _proto.settle = /*#__PURE__*/function () {
          var _settle = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee5(attemptId) {
            var _owner$getActiveRunSn, _ledger$pendingAttemp, _owner$getActiveRunSn2, _persistedBundle$run;
            var owner, generation, bundle, run, ledger, receipt, persisted, pending, sameDay, projected, nextLedger, next, committed, readback, persistedBundle;
            return _regeneratorRuntime().wrap(function _callee5$(_context5) {
              while (1) switch (_context5.prev = _context5.next) {
                case 0:
                  owner = this.host, generation = this.hostGeneration;
                  if (owner) {
                    _context5.next = 3;
                    break;
                  }
                  return _context5.abrupt("return");
                case 3:
                  bundle = owner.getBundle();
                  run = owner.getActiveRunSnapshot();
                  if (!(!bundle || !run)) {
                    _context5.next = 7;
                    break;
                  }
                  return _context5.abrupt("return");
                case 7:
                  _context5.next = 9;
                  return owner.waitForSaveIdle();
                case 9:
                  if (!(this.host !== owner || generation !== this.hostGeneration || ((_owner$getActiveRunSn = owner.getActiveRunSnapshot()) == null ? void 0 : _owner$getActiveRunSn.runId) !== run.runId)) {
                    _context5.next = 11;
                    break;
                  }
                  return _context5.abrupt("return");
                case 11:
                  bundle = owner.getBundle();
                  if (bundle) {
                    _context5.next = 14;
                    break;
                  }
                  return _context5.abrupt("return");
                case 14:
                  ledger = bundle.profile.rewardedRevive;
                  if (!ReviveLedger.hasReceipt(ledger, attemptId)) {
                    _context5.next = 36;
                    break;
                  }
                  receipt = ledger.receipts.find(function (item) {
                    return item.attemptId === attemptId;
                  });
                  persisted = bundle.run;
                  if (!(!receipt || receipt.runId !== run.runId || !persisted || persisted.runId !== run.runId || persisted.revive.used !== 1 || persisted.revive.committedReceiptId !== attemptId)) {
                    _context5.next = 24;
                    break;
                  }
                  this.phase = 'ERROR';
                  this.retrySettle = false;
                  this.message = '复活凭证与当前局不匹配，未应用。';
                  this.changed();
                  return _context5.abrupt("return");
                case 24:
                  if (owner.applyCommittedRevive(attemptId)) {
                    _context5.next = 30;
                    break;
                  }
                  this.phase = 'ERROR';
                  this.retrySettle = false;
                  this.message = '复活凭证无法应用到当前局，请返回结算。';
                  this.changed();
                  return _context5.abrupt("return");
                case 30:
                  this.phase = 'GRANTED';
                  this.message = null;
                  this.retrySettle = false;
                  this.pendingAttempt = null;
                  this.changed();
                  return _context5.abrupt("return");
                case 36:
                  if (!(((_ledger$pendingAttemp = ledger.pendingAttempt) == null ? void 0 : _ledger$pendingAttemp.attemptId) !== attemptId || ledger.pendingAttempt.runId !== run.runId)) {
                    _context5.next = 42;
                    break;
                  }
                  this.phase = 'ERROR';
                  this.retrySettle = false;
                  this.message = '找不到本局待确认的复活记录，未发放。';
                  this.changed();
                  return _context5.abrupt("return");
                case 42:
                  if (!(run.revive.used !== 0 || !run.revive.pendingFailure)) {
                    _context5.next = 48;
                    break;
                  }
                  this.phase = 'ERROR';
                  this.retrySettle = false;
                  this.message = '本局已不满足复活条件，未发放。';
                  this.changed();
                  return _context5.abrupt("return");
                case 48:
                  pending = ledger.pendingAttempt;
                  sameDay = ReviveLedger.normalize(ledger, pending.dayKey);
                  if (!(this.env.policy.maxDailyRevives - ReviveLedger.grantedForDay(sameDay, pending.dayKey) < 1)) {
                    _context5.next = 56;
                    break;
                  }
                  this.phase = 'ERROR';
                  this.retrySettle = false;
                  this.message = '今日复活次数已达上限，未发放。';
                  this.changed();
                  return _context5.abrupt("return");
                case 56:
                  projected = owner.projectRevive(attemptId);
                  if (projected.ok) {
                    _context5.next = 63;
                    break;
                  }
                  this.phase = 'ERROR';
                  this.retrySettle = false;
                  this.message = projected.error.message;
                  this.changed();
                  return _context5.abrupt("return");
                case 63:
                  nextLedger = ReviveLedger.grant(ledger, ReviveLedger.receiptFor(pending, this.now()), run.runId);
                  next = copy(bundle);
                  next.profile.rewardedRevive = nextLedger;
                  next.run = projected.data;
                  _context5.next = 69;
                  return this.repo.commitBundle(owner.getSaveRevision(), run.runId, next);
                case 69:
                  committed = _context5.sent;
                  if (!(this.host !== owner || generation !== this.hostGeneration || ((_owner$getActiveRunSn2 = owner.getActiveRunSnapshot()) == null ? void 0 : _owner$getActiveRunSn2.runId) !== run.runId)) {
                    _context5.next = 72;
                    break;
                  }
                  return _context5.abrupt("return");
                case 72:
                  if (committed.ok) {
                    _context5.next = 78;
                    break;
                  }
                  this.phase = 'ERROR';
                  this.retrySettle = true;
                  this.message = '广告已完成，但复活存档保存失败；请稍后重试领取。';
                  this.changed();
                  return _context5.abrupt("return");
                case 78:
                  _context5.next = 80;
                  return this.repo.readBundle();
                case 80:
                  readback = _context5.sent;
                  if (!(this.host !== owner || generation !== this.hostGeneration)) {
                    _context5.next = 83;
                    break;
                  }
                  return _context5.abrupt("return");
                case 83:
                  if (!(!readback.ok || !readback.data.envelope)) {
                    _context5.next = 89;
                    break;
                  }
                  this.phase = 'ERROR';
                  this.retrySettle = true;
                  this.message = '复活存档回读失败，可重试领取。';
                  this.changed();
                  return _context5.abrupt("return");
                case 89:
                  persistedBundle = readback.data.envelope.payload;
                  if (!(!ReviveLedger.hasReceipt(persistedBundle.profile.rewardedRevive, attemptId) || ((_persistedBundle$run = persistedBundle.run) == null ? void 0 : _persistedBundle$run.runId) !== run.runId || persistedBundle.run.revive.used !== 1 || persistedBundle.run.revive.committedReceiptId !== attemptId)) {
                    _context5.next = 96;
                    break;
                  }
                  this.phase = 'ERROR';
                  this.retrySettle = true;
                  this.message = '复活账本与本局状态未能一致回读，可重试领取。';
                  this.changed();
                  return _context5.abrupt("return");
                case 96:
                  owner.onSpillReviveCommitted(persistedBundle, committed.data.revision);
                  if (owner.applyCommittedRevive(attemptId)) {
                    _context5.next = 103;
                    break;
                  }
                  this.phase = 'ERROR';
                  this.retrySettle = true;
                  this.message = '复活已保存，但应用失败，可重试领取。';
                  this.changed();
                  return _context5.abrupt("return");
                case 103:
                  this.pendingAttempt = null;
                  this.stalePending = false;
                  this.phase = 'GRANTED';
                  this.message = null;
                  this.retrySettle = false;
                  this.changed();
                case 109:
                case "end":
                  return _context5.stop();
              }
            }, _callee5, this);
          }));
          function settle(_x3) {
            return _settle.apply(this, arguments);
          }
          return settle;
        }();
        _proto.changed = function changed() {
          var _this$host7;
          (_this$host7 = this.host) == null || _this$host7.onSpillReviveChanged();
        };
        _proto.blockMessage = function blockMessage(block) {
          switch (block) {
            case 'POLICY_DISABLED':
              return '洒出复活广告尚未开启';
            case 'AD_UNCONFIGURED':
              return '未配置真实复活广告位';
            case 'AD_UNSUPPORTED':
              return '当前环境不支持激励广告';
            case 'NO_ACTIVE_RUN':
            case 'NOT_SPILL_PENDING':
              return '当前没有可复活的洒出局';
            case 'RUN_LIMIT':
              return '本局已使用过复活';
            case 'DAILY_LIMIT':
              return '今日复活次数已达上限';
            case 'TUTORIAL_REQUIRED':
              return '完成教程后可观看复活广告';
            case 'FIRST_RUN_REQUIRED':
              return '完成一局真实游戏后可观看复活广告';
            case 'FOREGROUND_REQUIRED':
              return '游戏时间稍短，暂不可观看复活广告';
            case 'PENDING_ATTEMPT':
              return '有未确认的复活奖励';
            default:
              return '暂不可复活';
          }
        };
        _createClass(SpillReviveService, [{
          key: "policy",
          get: function get() {
            return this.env.policy;
          }
        }]);
        return SpillReviveService;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/TapRewardedAdProvider.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
  var _asyncToGenerator, _regeneratorRuntime, cclegacy;
  return {
    setters: [function (module) {
      _asyncToGenerator = module.asyncToGenerator;
      _regeneratorRuntime = module.regeneratorRuntime;
    }, function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      cclegacy._RF.push({}, "16135y3iulEAaKxVZxYy2Hf", "TapRewardedAdProvider", undefined);
      var tapApi = function tapApi() {
        return globalThis.tap;
      };

      /** Attempt-scoped Tap mini-game adapter. SDK listeners are owned and removed per multiton instance. */
      var TapRewardedAdProvider = exports('TapRewardedAdProvider', /*#__PURE__*/function () {
        function TapRewardedAdProvider(policy) {
          this.providerName = 'tap';
          this.active = null;
          this.generation = 0;
          this.disposed = false;
          this.policy = policy;
        }
        var _proto = TapRewardedAdProvider.prototype;
        _proto.capability = function capability() {
          var _tapApi;
          if (!this.policy.enabled) return 'DISABLED';
          if (!this.policy.adUnitId) return 'UNCONFIGURED';
          return typeof ((_tapApi = tapApi()) == null ? void 0 : _tapApi.createRewardedVideoAd) === 'function' ? 'SUPPORTED' : 'UNSUPPORTED';
        };
        _proto.prepare = /*#__PURE__*/function () {
          var _prepare = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
            var _this = this;
            var state;
            return _regeneratorRuntime().wrap(function _callee$(_context) {
              while (1) switch (_context.prev = _context.next) {
                case 0:
                  if (!this.disposed) {
                    _context.next = 2;
                    break;
                  }
                  return _context.abrupt("return", this.fail('REWARD_AD_DISPOSED'));
                case 2:
                  state = this.getInstance();
                  if (state) {
                    _context.next = 5;
                    break;
                  }
                  return _context.abrupt("return", this.fail('REWARD_AD_UNSUPPORTED'));
                case 5:
                  if (!state.loaded) {
                    _context.next = 7;
                    break;
                  }
                  return _context.abrupt("return", {
                    ok: true,
                    data: undefined
                  });
                case 7:
                  if (!state.preparing) {
                    _context.next = 9;
                    break;
                  }
                  return _context.abrupt("return", state.preparing);
                case 9:
                  if (!(typeof state.instance.load !== 'function')) {
                    _context.next = 11;
                    break;
                  }
                  return _context.abrupt("return", this.fail('REWARD_AD_LOAD_UNSUPPORTED'));
                case 11:
                  state.preparing = new Promise(function (resolve) {
                    var done = false;
                    var finish = function finish(ok, code) {
                      if (code === void 0) {
                        code = 'REWARD_AD_LOAD_FAILED';
                      }
                      if (done) return;
                      done = true;
                      clearTimeout(timer);
                      state.preparing = null;
                      state.loaded = ok;
                      state.loadFinish = null;
                      resolve(ok ? {
                        ok: true,
                        data: undefined
                      } : _this.fail(code));
                      if (!ok) {
                        _this.detach(state);
                        if (_this.active === state) _this.active = null;
                      }
                    };
                    var timer = setTimeout(function () {
                      return finish(false, 'REWARD_AD_LOAD_TIMEOUT');
                    }, 10000);
                    state.loadFinish = function (ok, code) {
                      return finish(ok, code);
                    };
                    try {
                      var p = state.instance.load();
                      if (!p || typeof p.then !== 'function') {
                        finish(false, 'REWARD_AD_LOAD_CONTRACT');
                        return;
                      }
                      p.then(function () {
                        return finish(true);
                      }, function () {
                        return finish(false, 'REWARD_AD_LOAD_REJECTED');
                      });
                    } catch (_unused) {
                      finish(false, 'REWARD_AD_LOAD_THROW');
                    }
                  });
                  return _context.abrupt("return", state.preparing);
                case 13:
                case "end":
                  return _context.stop();
              }
            }, _callee, this);
          }));
          function prepare() {
            return _prepare.apply(this, arguments);
          }
          return prepare;
        }();
        _proto.show = function show(attemptId) {
          var _this2 = this;
          if (this.disposed) return Promise.resolve({
            kind: 'FAILED',
            attemptId: attemptId,
            errorCode: 'REWARD_AD_DISPOSED'
          });
          var state = this.active;
          if (!state || !state.loaded || typeof state.instance.show !== 'function') return Promise.resolve({
            kind: 'UNAVAILABLE',
            attemptId: attemptId,
            errorCode: 'REWARD_AD_NOT_PREPARED'
          });
          if (state.pending) return Promise.resolve({
            kind: 'UNAVAILABLE',
            attemptId: attemptId,
            errorCode: 'REWARD_AD_BUSY'
          });
          return new Promise(function (resolve) {
            state.pending = {
              attemptId: attemptId,
              resolve: resolve
            };
            try {
              var p = state.instance.show();
              if (!p || typeof p.then !== 'function') _this2.finish(state, {
                kind: 'FAILED',
                attemptId: attemptId,
                errorCode: 'REWARD_AD_SHOW_CONTRACT'
              });else p["catch"](function () {
                return _this2.finish(state, {
                  kind: 'FAILED',
                  attemptId: attemptId,
                  errorCode: 'REWARD_AD_SHOW_REJECTED'
                });
              });
            } catch (_unused2) {
              _this2.finish(state, {
                kind: 'FAILED',
                attemptId: attemptId,
                errorCode: 'REWARD_AD_SHOW_THROW'
              });
            }
          });
        };
        _proto.getInstance = function getInstance() {
          var _this3 = this;
          if (this.active) return this.active;
          var api = tapApi();
          if (!(api != null && api.createRewardedVideoAd) || !this.policy.adUnitId) return null;
          try {
            var instance = api.createRewardedVideoAd({
              adUnitId: this.policy.adUnitId,
              multiton: true
            });
            var generation = ++this.generation;
            var state = {
              generation: generation,
              instance: instance,
              loaded: false,
              preparing: null,
              pending: null,
              loadFinish: null,
              onLoad: function onLoad() {},
              onError: function onError() {},
              onClose: function onClose() {}
            };
            state.onLoad = function () {
              state.loaded = true;
              state.loadFinish == null || state.loadFinish(true);
            };
            state.onError = function () {
              state.loaded = false;
              if (state.pending) _this3.finish(state, {
                kind: 'FAILED',
                attemptId: state.pending.attemptId,
                errorCode: 'REWARD_AD_NATIVE_ERROR'
              });else state.loadFinish == null || state.loadFinish(false, 'REWARD_AD_LOAD_ERROR');
            };
            state.onClose = function (result) {
              var pending = state.pending;
              if (!pending) return;
              _this3.finish(state, (result == null ? void 0 : result.isEnded) === true ? {
                kind: 'COMPLETED',
                attemptId: pending.attemptId
              } : {
                kind: 'CANCELLED',
                attemptId: pending.attemptId,
                errorCode: 'REWARD_AD_CLOSED_EARLY'
              });
            };
            if (!instance.onLoad || !instance.offLoad || !instance.onError || !instance.offError || !instance.onClose || !instance.offClose || !instance.load || !instance.show) return null;
            instance.onLoad(state.onLoad);
            instance.onError(state.onError);
            instance.onClose(state.onClose);
            this.active = state;
            return state;
          } catch (_unused3) {
            return null;
          }
        };
        _proto.finish = function finish(state, outcome) {
          var pending = state.pending;
          if (!pending || pending.attemptId !== outcome.attemptId) return;
          state.pending = null;
          state.loaded = false;
          pending.resolve(outcome);
          this.detach(state);
          if (this.active === state) this.active = null;
        };
        _proto.detach = function detach(state) {
          try {
            state.instance.offLoad == null || state.instance.offLoad(state.onLoad);
            state.instance.offError == null || state.instance.offError(state.onError);
            state.instance.offClose == null || state.instance.offClose(state.onClose);
            state.instance.destroy == null || state.instance.destroy();
          } catch (_unused4) {/* per-instance teardown is best effort */}
        };
        _proto.fail = function fail(code) {
          return {
            ok: false,
            error: {
              code: code,
              message: code,
              retryable: true
            }
          };
        };
        _proto.dispose = function dispose() {
          if (this.disposed) return;
          this.disposed = true;
          var s = this.active;
          this.active = null;
          if (s) {
            if (s.pending) this.finish(s, {
              kind: 'FAILED',
              attemptId: s.pending.attemptId,
              errorCode: 'REWARD_AD_DISPOSED'
            });
            this.detach(s);
          }
        };
        return TapRewardedAdProvider;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/types.ts", ['cc'], function () {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      cclegacy._RF.push({}, "1ccf1JIhlBUXoLO5H6/hEvH", "types", undefined);
      /** Design contracts v0.2. Interfaces only; no game or API implementation. */
      /** Per-run revive entitlement. A pending failure freezes the run until the player accepts or declines the offer. */
      /** Frozen spill metadata. The cleaned candidate is rebuilt deterministically from the paused snapshot and config. */
      /** secondId=null means a static cup boundary. Logical eligibility stays owned by RunEngine. */
      /** P1-B local execution acknowledgement; it is not a DomainEvent or network command. */
      /** Legacy schema (v4 run / v2 profile) kept only for safe migration reads. */
      /** Legacy schema (v2 runs / v1 profile) kept only for safe migration reads. */
      /** Previous profile schema kept only for migration reads. */
      /** Runtime Tap rewarded-video policy for the extra-shake placement. Closed by default until a real ad unit is configured. */
      /** Runtime Tap rewarded-video policy for the once-per-run spill revive placement. Closed by default. */
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/Viewport.ts", ['cc'], function (exports) {
  var cclegacy, view, Node, UITransform, Canvas, Camera, ResolutionPolicy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
      view = module.view;
      Node = module.Node;
      UITransform = module.UITransform;
      Canvas = module.Canvas;
      Camera = module.Camera;
      ResolutionPolicy = module.ResolutionPolicy;
    }],
    execute: function () {
      exports({
        configureViewport: configureViewport,
        gameUiPoint: gameUiPoint,
        presentationSize: presentationSize
      });
      cclegacy._RF.push({}, "1a01eI0KgdN4730AvoCX3Pv", "Viewport", undefined);
      var resizeHandlers = new WeakMap();

      /** The fixed gameplay board stays centered; only the decorative viewing area grows. */
      function presentationSize() {
        var size = view.getVisibleSize();
        return {
          width: size.width,
          height: size.height
        };
      }
      function gameUiPoint(point, viewport) {
        var visible = view.getVisibleSize();
        return {
          x: point.x - (visible.width - viewport.width_du) / 2,
          y: point.y - (visible.height - viewport.height_du) / 2
        };
      }

      /** Display-only adaptation. Physics positions, collider sizes and solver units stay in their own mapper. */
      function configureViewport(root, viewport) {
        var _root$getComponent, _root$getComponent2, _root$scene$getChildB;
        // Avoid high-DPR color/depth buffers multiplying memory on mobile hosts.
        view.enableRetina(false);
        var applyPolicy = function applyPolicy() {
          var frame = view.getFrameSize();
          var policy = frame.height / frame.width >= viewport.height_du / viewport.width_du ? ResolutionPolicy.FIXED_WIDTH : ResolutionPolicy.SHOW_ALL;
          view.setDesignResolutionSize(viewport.width_du, viewport.height_du, policy);
        };
        var oldHandler = resizeHandlers.get(root);
        if (oldHandler) view.off('canvas-resize', oldHandler);
        applyPolicy();
        view.on('canvas-resize', applyPolicy);
        resizeHandlers.set(root, applyPolicy);
        if (!oldHandler) root.once(Node.EventType.NODE_DESTROYED, function () {
          var handler = resizeHandlers.get(root);
          if (handler) view.off('canvas-resize', handler);
          resizeHandlers["delete"](root);
        });
        var transform = (_root$getComponent = root.getComponent(UITransform)) != null ? _root$getComponent : root.addComponent(UITransform);
        transform.setContentSize(viewport.width_du, viewport.height_du);
        var canvas = (_root$getComponent2 = root.getComponent(Canvas)) != null ? _root$getComponent2 : root.addComponent(Canvas);
        var camera = (_root$scene$getChildB = root.scene.getChildByName('Main Camera')) == null ? void 0 : _root$scene$getChildB.getComponent(Camera);
        if (!camera) throw new Error('场景缺少Main Camera');
        camera.projection = Camera.ProjectionType.ORTHO;
        canvas.cameraComponent = camera;
        canvas.alignCanvasWithScreen = true;
      }
      cclegacy._RF.pop();
    }
  };
});

(function(r) {
  r('virtual:///prerequisite-imports/main', 'chunks:///_virtual/main'); 
})(function(mid, cid) {
    System.register(mid, [cid], function (_export, _context) {
    return {
        setters: [function(_m) {
            var _exportObj = {};

            for (var _key in _m) {
              if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _m[_key];
            }
      
            _export(_exportObj);
        }],
        execute: function () { }
    };
    });
});
//# sourceMappingURL=index.js.map