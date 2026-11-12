export class SceneManager {
  constructor(parent) {
    this.parent = parent;
    this.current = null;
  }

  show(scene) {
    if (this.current) {
      this.parent.removeChild(this.current.container);
      this.current.destroy?.();
      this.current.container.destroy({ children: true });
    }

    this.current = scene;
    this.parent.addChild(scene.container);
    scene.init?.();
  }

  update(deltaMS) {
    this.current?.update?.(deltaMS);
  }
}
