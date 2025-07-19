// Vector3 class đầy đủ
class Vector3 {
  constructor(x, y, z) {
    this.x = x; this.y = y; this.z = z;
  }

  subtract(v) {
    return new Vector3(this.x - v.x, this.y - v.y, this.z - v.z);
  }

  add(v) {
    return new Vector3(this.x + v.x, this.y + v.y, this.z + v.z);
  }

  dot(v) {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }

  length() {
    return Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2);
  }

  normalize() {
    const len = this.length();
    return len === 0 ? new Vector3(0, 0, 0) : new Vector3(this.x / len, this.y / len, this.z / len);
  }

  distanceTo(v) {
    return this.subtract(v).length();
  }
}

// Giả lập trạng thái game (thay thế bằng dữ liệu thật)
const camera = {
  position: { x: 0, y: 1.6, z: -2 },
  rotation: { x: 0, y: 0 }
};

let fireButtonPressed = false;
let autoFireEnabled = true;

// --- Utility ---
function getCameraPosition() {
  return new Vector3(camera.position.x, camera.position.y, camera.position.z);
}
function getCameraDirection() {
  const yaw = camera.rotation.y;
  const pitch = camera.rotation.x;
  return new Vector3(
    Math.sin(yaw) * Math.cos(pitch),
    Math.sin(-pitch),
    Math.cos(yaw) * Math.cos(pitch)
  ).normalize();
}
function applyFullTransform(position, bindpose) {
  const x = position.x, y = position.y, z = position.z;
  return new Vector3(
    bindpose.e00 * x + bindpose.e01 * y + bindpose.e02 * z + bindpose.e03,
    bindpose.e10 * x + bindpose.e11 * y + bindpose.e12 * z + bindpose.e13,
    bindpose.e20 * x + bindpose.e21 * y + bindpose.e22 * z + bindpose.e23
  );
}

// Tạo hitbox bone_Head
function createHeadHitbox(config, boneHeadPos, bindposeMatrix) {
  const col = config.boneColliderProperty || config.defaultBoneColliderProperty;
  const scale = col?.reducerProperty?.scale || { x: 1, y: 1, z: 1 };
  const offset = col?.reducerProperty?.offset || { x: 0, y: 0, z: 0 };
  const minThickness = col?.reducerProperty?.minThickness || { x: 0.01, y: 0.01, z: 0.01 };
  const radius = Math.max(minThickness.x, minThickness.z, 0.1);

  const transformed = applyFullTransform(boneHeadPos, bindposeMatrix);
  const center = transformed.add(new Vector3(offset.x, offset.y, offset.z));

  return {
    center: center,
    radius: radius,
    height: 0.22 * scale.y
  };
}

// Kéo tâm về giữa đầu
function dragAimToHead(headCenter, cameraPos) {
  const dir = headCenter.subtract(cameraPos).normalize();
  const yaw = Math.atan2(dir.x, dir.z);
  const pitch = -Math.asin(dir.y);
  applyAimRotation(yaw, pitch);
}
function applyAimRotation(yaw, pitch) {
  const smooth = 0.22;
  camera.rotation.y += (yaw - camera.rotation.y) * smooth;
  camera.rotation.x += (pitch - camera.rotation.x) * smooth;
}

// Trigger bắn nếu crosshair gần đầu
function crosshairInsideHead(cameraPos, cameraDir, headCenter, radius) {
  const toHead = headCenter.subtract(cameraPos);
  const projLength = cameraDir.dot(toHead);

  if (projLength < 0) return false; // Đầu ở phía sau camera

  const projPoint = new Vector3(
    cameraPos.x + cameraDir.x * projLength,
    cameraPos.y + cameraDir.y * projLength,
    cameraPos.z + cameraDir.z * projLength
  );

  const distToCenter = projPoint.distanceTo(headCenter);
  return distToCenter <= radius * 1.05; // margin 5%
}

// Bắn
function triggerShoot() {
  console.log("🔫 Auto-FIRE triggered!");
  // TODO: Thêm code bắn thực tế (gửi event chuột hoặc gọi API)
}

// Hàm chính auto lock + trigger
function autoLockAndTrigger(config, boneHeadPos, bindposeMatrix) {
  const cameraPos = getCameraPosition();
  const cameraDir = getCameraDirection();
  const headHitbox = createHeadHitbox(config, boneHeadPos, bindposeMatrix);
  const headCenter = headHitbox.center;

  // Lock 360° kéo tâm ngắm về đầu khi nhấn bắn
  if (fireButtonPressed) {
    dragAimToHead(headCenter, cameraPos);
  }

  // Tự động trigger bắn khi tâm ngắm đã nằm trong vùng head
  if (autoFireEnabled && crosshairInsideHead(cameraPos, cameraDir, headCenter, headHitbox.radius)) {
    triggerShoot();
  }
}

// === Đầu vào (thay thế đúng JSON collider của bạn) ===
const GamePackages = {
  GamePackage1: "com.dts.freefireth",
  GamePackage2: "com.dts.freefiremax"
};
const headConfig = {
  "boneColliderProperty": {
    "boneProperty": {
      "recursivery": 0
    },
    "splitProperty": {
      "boneWeightType": 0,
      "boneWeight2": 100,
      "boneWeight3": 100,
      "boneWeight4": 100,
      "greaterBoneWeight": 1,
      "boneTriangleExtent": 0
    },
    "reducerProperty": {
      "shapeType": 3,
      "fitType": 0,
      "meshType": 3,
      "maxTriangles": 255,
      "sliceMode": 0,
      "scale": {
        "x": 1.0,
        "y": 1.0,
        "z": 1.0
      },
      "scaleElementType": 0,
      "minThickness": {
        "x": 0.01,
        "y": 0.01,
        "z": 0.01
      },
      "minThicknessElementType": 0,
      "optimizeRotation": {
        "x": 1,
        "y": 1,
        "z": 1
      },
      "optimizeRotationElementType": 0,
      "colliderToChild": 2,
      "offset": {
        "x": 0.0,
        "y": 0.0,
        "z": 0.0
      },
      "thicknessA": {
        "x": 0.0,
        "y": 0.0,
        "z": 0.0
      },
      "thicknessB": {
        "x": 0.0,
        "y": 0.0,
        "z": 0.0
      },
      "viewAdvanced": 0
    },
    "colliderProperty": {
      "convex": 1,
      "isTrigger": 0,
      "material": {
        "m_FileID": 0,
        "m_PathID": 0
      },
      "isCreateAsset": 0
    },
    "rigidbodyProperty": {
      "mass": 1.0,
      "drag": 0.0,
      "angularDrag": 0.05,
      "isKinematic": 1,
      "useGravity": 0,
      "interpolation": 0,
      "collisionDetectionMode": 0,
      "isCreate": 0,
      "viewAdvanced": 0
    },
    "modifyNameEnabled": 0
  },
  "defaultBoneColliderProperty": {
    "boneProperty": {
      "recursivery": 0
    },
    "splitProperty": {
      "boneWeightType": 0,
      "boneWeight2": 50,
      "boneWeight3": 33,
      "boneWeight4": 25,
      "greaterBoneWeight": 1,
      "boneTriangleExtent": 1
    },
    "reducerProperty": {
      "shapeType": 2,
      "fitType": 0,
      "meshType": 3,
      "maxTriangles": 255,
      "sliceMode": 0,
      "scale": {
        "x": 1.0,
        "y": 1.0,
        "z": 1.0
      },
      "scaleElementType": 0,
      "minThickness": {
        "x": 0.01,
        "y": 0.01,
        "z": 0.01
      },
      "minThicknessElementType": 0,
      "optimizeRotation": {
        "x": 1,
        "y": 1,
        "z": 1
      },
      "optimizeRotationElementType": 0,
      "colliderToChild": 0,
      "offset": {
        "x": 0.0,
        "y": 0.0,
        "z": 0.0
      },
      "thicknessA": {
        "x": 0.0,
        "y": 0.0,
        "z": 0.0
      },
      "thicknessB": {
        "x": 0.0,
        "y": 0.0,
        "z": 0.0
      },
      "viewAdvanced": 0
    },
    "colliderProperty": {
      "convex": 1,
      "isTrigger": 0,
      "material": {
        "m_FileID": 0,
        "m_PathID": 0
      },
      "isCreateAsset": 0
    },
    "rigidbodyProperty": {
      "mass": 1.0,
      "drag": 0.0,
      "angularDrag": 0.05,
      "isKinematic": 1,
      "useGravity": 0,
      "interpolation": 0,
      "collisionDetectionMode": 0,
      "isCreate": 1,
      "viewAdvanced": 0
    },
    "modifyNameEnabled": 0
}
};

const boneHeadPosition = { x: -0.0457, y: -0.00447, z: -0.02004 };
const bindpose = {
  e00: -1.34559613e-13, e01: 8.881784e-14, e02: -1.0, e03: 0.487912,
  e10: -2.84512817e-06, e11: -1.0, e12: 8.881784e-14, e13: -2.842171e-14,
  e20: -1.0, e21: 2.84512817e-06, e22: -1.72951931e-13, e23: 0.0,
  e30: 0.0, e31: 0.0, e32: 0.0, e33: 1.0
};

// === Vòng lặp game (tick) ===
setInterval(() => {
  autoLockAndTrigger(headConfig, boneHeadPosition, bindpose);
}, 16);
