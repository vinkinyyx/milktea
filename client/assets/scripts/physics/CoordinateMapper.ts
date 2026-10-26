import { Vec2 } from '../contracts/types';

/** DU are design pixels. Box2D length is DU/DU-per-spec-unit; Cocos node units are Box2D length*PTM. */
export class CoordinateMapper {
  constructor(readonly widthDu: number, readonly heightDu: number, readonly duPerSpecPhysicsUnit: number, readonly cocosPtmRatio: number) {
    if (![widthDu, heightDu, duPerSpecPhysicsUnit, cocosPtmRatio].every(Number.isFinite) || widthDu <= 0 || heightDu <= 0 || duPerSpecPhysicsUnit <= 0 || cocosPtmRatio <= 0) throw new Error('Invalid coordinate scale');
  }
  /** Cocos touch/UI screen coordinates use a bottom-left origin. */
  screenToDu(point: Vec2, screenWidth: number, screenHeight: number): Vec2 {
    const scale = Math.min(screenWidth / this.widthDu, screenHeight / this.heightDu);
    const offsetX = (screenWidth - this.widthDu * scale) / 2;
    const offsetY = (screenHeight - this.heightDu * scale) / 2;
    return { x: (point.x - offsetX) / scale, y: (point.y - offsetY) / scale };
  }
  uiTopLeftToDu(point: Vec2, screenWidth: number, screenHeight: number): Vec2 {
    return this.screenToDu({ x: point.x, y: screenHeight - point.y }, screenWidth, screenHeight);
  }
  duToScreen(point: Vec2, screenWidth: number, screenHeight: number): Vec2 {
    const scale = Math.min(screenWidth / this.widthDu, screenHeight / this.heightDu);
    const offsetX = (screenWidth - this.widthDu * scale) / 2;
    const offsetY = (screenHeight - this.heightDu * scale) / 2;
    return { x: offsetX + point.x * scale, y: offsetY + (this.heightDu - point.y) * scale };
  }
  specAccelerationToDu(specUnitsPerSecondSquared: number): number { return specUnitsPerSecondSquared * this.duPerSpecPhysicsUnit; }
  duVelocityToSpec(duPerSecond: number): number { return duPerSecond / this.duPerSpecPhysicsUnit; }
  /** RigidBody2D.linearVelocity is in Box2D m/s, not Cocos node-units/s. */
  duVelocityToBox2D(duPerSecond: number): number { return duPerSecond / this.duPerSpecPhysicsUnit; }
  box2DVelocityToDu(bodyMetersPerSecond: number): number { return bodyMetersPerSecond * this.duPerSpecPhysicsUnit; }
  duAccelerationToBox2D(duPerSecondSquared: number): number { return duPerSecondSquared / this.duPerSpecPhysicsUnit; }
  /** Cocos node/collider coordinates are pixels; one Box2D meter occupies PTM pixels. */
  duToCocosWorld(du: number): number { return du / this.duPerSpecPhysicsUnit * this.cocosPtmRatio; }
  cocosWorldToDu(cocosUnits: number): number { return cocosUnits / this.cocosPtmRatio * this.duPerSpecPhysicsUnit; }
  duToBox2DMeters(du: number): number { return du / this.duPerSpecPhysicsUnit; }
  box2DMetersToDu(meters: number): number { return meters * this.duPerSpecPhysicsUnit; }
  /** PhysicsSystem2D.gravity is a Cocos-unit acceleration; its setter divides by PTM. */
  specAccelerationToCocosGravityApi(specUnitsPerSecondSquared: number): number { return specUnitsPerSecondSquared * this.cocosPtmRatio; }
}
