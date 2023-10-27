/* globals
game,
Hooks
*/
"use strict";

import { MODULE_ID, COVER, setCoverIgnoreHandler } from "./const.js";

// Hooks and method registration
import { registerGeometry } from "./geometry/registration.js";
import { initializePatching, PATCHER } from "./patching.js";
import { Settings, DEBUG_GRAPHICS, SETTINGS } from "./Settings.js";

// For API
import { PointsLOS } from "./LOS/PointsLOS.js";
import { Area3d, Area3dLOS } from "./LOS/Area3dLOS.js";
import { Area2d, Area2dLOS } from "./LOS/Area2dLOS.js";
import { ConstrainedTokenBorder } from "./LOS/ConstrainedTokenBorder.js";
import { Area3dPopout, area3dPopoutData } from "./LOS/Area3dPopout.js";

import { CoverCalculator } from "./CoverCalculator.js";
import { CoverDialog } from "./CoverDialog.js";

// Ignores Cover
import {
  IgnoresCover,
  IgnoresCoverSimbuls,
  IgnoresCoverDND5e,
  addDND5eCoverFeatFlags } from "./IgnoresCover.js";

// Other self-executing hooks
import "./changelog.js";
import "./migration.js";
import "./cover_application.js";

Hooks.once("init", function() {
  registerGeometry();
  initializePatching();
  addDND5eCoverFeatFlags();

  game.modules.get(MODULE_ID).api = {
    PointsLOS,
    Area2dLOS,
    Area3dLOS,
    Area2d,
    Area3d,
    CoverCalculator,
    CoverDialog,
    COVER,
    ConstrainedTokenBorder,
    setCoverIgnoreHandler,
    Settings,

    IgnoresCoverClasses: {
      IgnoresCover,
      IgnoresCoverDND5e,
      IgnoresCoverSimbuls
    },

    Area3dPopout,
    area3dPopoutData,

    PATCHER
  };

  if ( game.system.id === "dnd5e" ) {
    setCoverIgnoreHandler(game.modules.get("simbuls-cover-calculator")?.active ? IgnoresCoverSimbuls : IgnoresCoverDND5e);
  }
});

Hooks.once("setup", function() {
  Settings.registerAll();
  Settings.updateConfigStatusEffects();
});

Hooks.on("canvasReady", function() {
  console.debug("tokenvisibility|canvasReady")
  DEBUG_GRAPHICS.LOS = new PIXI.Graphics();
  if ( Settings.get(SETTINGS.DEBUG.LOS ) ) canvas.tokens.addChild(DEBUG_GRAPHICS.LOS);
});

Hooks.on("canvasTearDown", function() {
  console.debug("tokenvisibility|canvasTearDown");
  canvas.tokens.removeChild(DEBUG_GRAPHICS.LOS);
  DEBUG_GRAPHICS.LOS.destroy();
});


