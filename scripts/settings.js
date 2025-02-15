/* globals
canvas,
CONFIG,
foundry,
game,
ItemDirectory,
readTextFromFile
ui
*/
/* eslint no-unused-vars: ["error", { "argsIgnorePattern": "^_" }] */
"use strict";

import { ModuleSettingsAbstract } from "./ModuleSettingsAbstract.js";
import { MODULE_ID, MODULES_ACTIVE, FLAGS } from "./const.js";
import { SettingsSubmenu } from "./SettingsSubmenu.js";
import { registerArea3d, registerDebug, deregisterDebug, registerTemplates, deregisterTemplates } from "./patching.js";
import { TokenCover } from "./TokenCover.js";
import { POINT_TYPES } from "./LOS/AlternativeLOS.js";
import { renderTemplateSync } from "./util.js";

export const PATCHES_SidebarTab = {};
export const PATCHES_ItemDirectory = {};
PATCHES_SidebarTab.BASIC = {};
PATCHES_ItemDirectory.BASIC = {};

/**
 * A fake settings menu that acts as a button; downloading on render and displaying nothing.
 */
class exportSettingsButton extends foundry.applications.api.ApplicationV2 {
  async render() {
    Settings.exportSettingsToJSON();
    const moduleName = game.i18n.localize(`${MODULE_ID}.name`);
    ui.notifications.notify(`The ${moduleName} settings have been downloaded to a JSON file.`);
  }
}

/**
 * Simple import dialog class for importing settings.
 */
class importSettingsDialog extends foundry.applications.api.DialogV2 {
  _initializeApplicationOptions(options) {
    const moduleName = game.i18n.localize(`${MODULE_ID}.name`);
    const content = renderTemplateSync("templates/apps/import-data.html", {
      hint1: `Replace ${moduleName} settings with those in a JSON file.`,
      hint2: "This cannot be undone!"
    });
    const importCallBack = async (_event, _button, dialog) => {
      const fileInput = dialog.getElementsByTagName("input")[0];
      if ( !fileInput ) return console.error(`${MODULE_ID}|Error with the dialog input form.`);
      const file = fileInput.files[0];
      if ( !file ) return ui.notifications.error("You did not upload a data file!");
      const json = await readTextFromFile(file);
      await Settings.importSettingsFromJSON(json);
      ui.notifications.notify(`${moduleName} settings updated.`);
    };
    options ??= {};
    options.window = { title: `${moduleName}|Import Settings` };
    options.content = content;
    options.buttons = [
      { action: "Replace", label: "Replace Settings", icon: "fas fa-file-import", callback: importCallBack },
      { action: "Cancel", label: "Cancel", icon: "fas fa-xmark", default: true }
    ];
    return super._initializeApplicationOptions(options);
  }
}

/**
 * Remove the terrains item from sidebar so it does not display.
 * From https://github.com/DFreds/dfreds-convenient-effects/blob/main/scripts/ui/remove-custom-item-from-sidebar.js#L3
 * @param {ItemDirectory} dir
 */
function removeCoverItemFromSidebar(dir) {
  if ( !(dir instanceof ItemDirectory) ) return;
  if ( !game.items ) return;
  for ( const item of game.items ) {
    if ( !(item.name === "Unique Active Effects" || item.getFlag(MODULE_ID, FLAGS.UNIQUE_EFFECT.ID)) ) continue;
    const li = dir.element.find(`li[data-document-id="${item.id}"]`);
    li.remove();
  }
}

PATCHES_SidebarTab.BASIC.HOOKS = { changeSidebarTab: removeCoverItemFromSidebar };
PATCHES_ItemDirectory.BASIC.HOOKS = { renderItemDirectory: removeCoverItemFromSidebar };

const CONTROLS = {
  COVER_EFFECTS: "cover-effects-control"
};

const MENUS = {
  SUBMENU: "submenu",
  EXPORT_BUTTON: "exportButton",
  IMPORT_BUTTON: "importButton"
};

const ENUMS = {
  USE_CHOICES: {
    NEVER: "never",
    COMBAT: "combat",
    COMBATANT: "combatant",
    ATTACK: "attack",
    ALWAYS: "always"
  },
  CONFIRM_CHOICES: {
    USER: "cover-workflow-confirm-user",
    USER_CANCEL: "cover-workflow-confirm-user-cancel",
    GM: "cover-workflow-confirm-gm",
    AUTO: "cover-workflow-confirm-automatic"
  },
  POINT_TYPES,
  ALGORITHM_TYPES: {
    POINTS: "los-points",
    AREA2D: "los-area-2d",
    AREA3D: "los-area-3d",
    AREA3D_GEOMETRIC: "los-area-3d-geometric",
    AREA3D_WEBGL1: "los-area-3d-webgl1",
    AREA3D_WEBGL2: "los-area-3d-webgl2",
    AREA3D_HYBRID: "los-area-3d-hybrid"
  },
  POINT_OPTIONS: {
    NUM_POINTS: "los-points-target",
    INSET: "los-inset-target",
    POINTS3D: "los-points-3d"
  }
};

export const SETTINGS = {
  UNIQUE_EFFECTS_FLAGS_DATA: "uniqueEffectsFlagsData",

  DISPLAY_COVER_BOOK: "display-cover-book",

  DISPLAY_SECRET_COVER: "display-secret-cover",

  TEMPLATES_USE_COVER: "templates-use-cover",

  ONLY_COVER_ICONS: "only-cover-icons", // Switches to CoverEffectFlags version that adds cover icons to tokens directly.

  COVER_EFFECTS: {
    USE: "use-cover-effects",
    // CHOICES: USE_CHOICES,
    DATA: "cover-effects-data",
    TARGETING: "cover-effects-targeting",
    RULES: "cover-rules"
  },

  COVER_WORKFLOW: {
    CHAT: "cover-chat-message",
    CONFIRM: "cover-workflow-confirm",
    CONFIRM_CHANGE_ONLY: "cover-workflow-confirm-change-only",
    CONFIRM_NO_COVER: "cover-workflow-confirm-no-cover",
    // CONFIRM_CHOICES,
  },

  // Taken from Alt. Token Visibility
  // POINT_TYPES,

  LOS: {
    VIEWER: {
      NUM_POINTS: "los-points-viewer",
      INSET: "los-inset-viewer"
    },

    TARGET: {
      ALGORITHM: "los-algorithm",
      LARGE: "los-large-target",
//       TYPES: {
//         POINTS: "los-points",
//         AREA2D: "los-area-2d",
//         AREA3D: "los-area-3d",
//         AREA3D_GEOMETRIC: "los-area-3d-geometric",
//         AREA3D_WEBGL1: "los-area-3d-webgl1",
//         AREA3D_WEBGL2: "los-area-3d-webgl2",
//         AREA3D_HYBRID: "los-area-3d-hybrid"
//       },
//       POINT_OPTIONS: {
//         NUM_POINTS: "los-points-target",
//         INSET: "los-inset-target",
//         POINTS3D: "los-points-3d"
//       }
    }
  },

  DEBUG: "debug-cover",
  PRONE_STATUS_ID: "prone-status-id",
  TOKEN_HP_ATTRIBUTE: "token-hp-attribute",

  PRONE_MULTIPLIER: "prone-multiplier",
  VISION_HEIGHT_MULTIPLIER: "vision-height-multiplier",

  // Hidden settings
  AREA3D_USE_SHADOWS: "area3d-use-shadows", // For benchmarking and debugging for now.
  CHANGELOG: "changelog",
  ATV_SETTINGS_MESSAGE: "atv-settings-message",
};

export class Settings extends ModuleSettingsAbstract {

  /** @type {object} */
  static KEYS = SETTINGS;

  /** @type {object} */
  static ENUMS = ENUMS;

  /** @type {object} */
  static CONTROLS = CONTROLS;

  static toggleDebugGraphics(enabled = false) {
    if ( enabled ) registerDebug();
    else {
      if ( canvas.tokens?.placeables ) canvas.tokens.placeables
        .filter(t => t._tokencover) // Don't create a new coverCalc here.
        .forEach(t => t[MODULE_ID].coverCalculator.clearDebug());
      deregisterDebug();
    }
  }

  /**
   * Register all settings
   */
  static registerAll() {
    const { KEYS, ENUMS, register, registerMenu, localize } = this;
    const PT_TYPES = ENUMS.POINT_TYPES;
    const RTYPES = [PT_TYPES.CENTER, PT_TYPES.FIVE, PT_TYPES.NINE];
    const PT_OPTS = ENUMS.POINT_OPTIONS;
    const LTYPES = foundry.utils.filterObject(ENUMS.ALGORITHM_TYPES, { POINTS: 0, AREA2D: 0, AREA3D: 0 });
    const losChoices = {};
    const ptChoices = {};
    const rangeChoices = {};

    const coverTypeUseChoices = {};
    const coverEffectUseChoices = {};
    const coverConfirmChoices = {};

    Object.values(RTYPES).forEach(type => rangeChoices[type] = localize(type));
    Object.values(LTYPES).forEach(type => losChoices[type] = localize(type));
    Object.values(PT_TYPES).forEach(type => ptChoices[type] = localize(type));

    Object.values(ENUMS.USE_CHOICES).forEach(type => coverTypeUseChoices[type] = localize(type));
    Object.values(ENUMS.USE_CHOICES).forEach(type => coverEffectUseChoices[type] = localize(type));
    Object.values(ENUMS.CONFIRM_CHOICES).forEach(type => coverConfirmChoices[type] = localize(type));

    // For most systems, no hooks set up into their attack sequence, so applying effects on attack is out.
    if ( game.system.id !== "dnd5e" ) {
      delete coverTypeUseChoices[ENUMS.USE_CHOICES.ATTACK];
      delete coverEffectUseChoices[ENUMS.USE_CHOICES.ATTACK];
    }

    // ----- Main Settings Menu ----- //
    registerMenu(MENUS.SUBMENU, {
      name: localize(`${MENUS.SUBMENU}.Name`),
      label: localize(`${MENUS.SUBMENU}.Label`),
      icon: "fas fa-user-gear",
      type: SettingsSubmenu,
      restricted: true
    });

    registerMenu(MENUS.EXPORT_BUTTON, {
      name: localize(`${MENUS.EXPORT_BUTTON}.Name`),
      label: localize(`${MENUS.EXPORT_BUTTON}.Label`),
      icon: "far fa-file-arrow-down",
      type: exportSettingsButton,
      restricted: true
    });

    registerMenu(MENUS.IMPORT_BUTTON, {
      name: localize(`${MENUS.IMPORT_BUTTON}.Name`),
      label: localize(`${MENUS.IMPORT_BUTTON}.Label`),
      icon: "far fa-file-arrow-up",
      type: importSettingsDialog,
      restricted: true
    });

    register(KEYS.DISPLAY_COVER_BOOK, {
      name: localize(`${KEYS.DISPLAY_COVER_BOOK}.Name`),
      hint: localize(`${KEYS.DISPLAY_COVER_BOOK}.Hint`),
      scope: "world",
      config: true,
      type: Boolean,
      default: true,
      onChange: value => {
        if ( !canvas.scene || !ui.controls.activeControl === "token" ) return;
        const tokenTools = ui.controls.controls.find(c => c.name === "token");
        const coverBook = tokenTools.tools.find(c => c.name === CONTROLS.COVER_EFFECTS);
        if ( !coverBook ) return;
        coverBook.visible = value;
        ui.controls.render(true);
      }
    });

    register(KEYS.DISPLAY_SECRET_COVER, {
      name: localize(`${KEYS.DISPLAY_SECRET_COVER}.Name`),
      hint: localize(`${KEYS.DISPLAY_SECRET_COVER}.Hint`),
      scope: "world",
      config: true,
      type: Boolean,
      default: true,
      onChange: _value => canvas.tokens.placeables.forEach(token => {
        token[MODULE_ID].updateCoverIconDisplay();
        CONFIG[MODULE_ID].CoverEffect.refreshTokenDisplay(token);
      })
    });

    register(KEYS.TEMPLATES_USE_COVER, {
      name: localize(`${KEYS.TEMPLATES_USE_COVER}.Name`),
      hint: localize(`${KEYS.TEMPLATES_USE_COVER}.Hint`),
      scope: "world",
      config: true,
      type: Boolean,
      default: true,
      onChange: value => value ? registerTemplates() : deregisterTemplates()
    });

    register(KEYS.ONLY_COVER_ICONS, {
      name: localize(`${KEYS.ONLY_COVER_ICONS}.Name`),
      hint: localize(`${KEYS.ONLY_COVER_ICONS}.Hint`),
      scope: "world",
      config: true,
      type: Boolean,
      default: false,
      requiresReload: true
    });

    register(KEYS.DEBUG, {
      name: localize(`${KEYS.DEBUG}.Name`),
      hint: localize(`${KEYS.DEBUG}.Hint`),
      scope: "world",
      config: true,
      type: Boolean,
      default: false,
      onChange: value => this.toggleDebugGraphics(value)
    });

    // ----- NOTE: Submenu ---- //

    // ----- NOTE: Line-of-sight viewer tab ----- //
    const VIEWER = KEYS.LOS.VIEWER;
    register(VIEWER.NUM_POINTS, {
      name: localize(`${VIEWER.NUM_POINTS}.Name`),
      hint: localize(`${VIEWER.NUM_POINTS}.Hint`),
      scope: "world",
      config: false,
      type: String,
      choices: ptChoices,
      default: PT_TYPES.CENTER,
      tab: "losViewer"
    });

    register(VIEWER.INSET, {
      name: localize(`${VIEWER.INSET}.Name`),
      hint: localize(`${VIEWER.INSET}.Hint`),
      range: {
        max: 0.99,
        min: 0,
        step: 0.01
      },
      scope: "world",
      config: false,
      default: 0.75,
      type: Number,
      tab: "losViewer"
    });

    // ----- NOTE: Line-of-sight target tab ----- //
    const TARGET = KEYS.LOS.TARGET;
    register(TARGET.LARGE, {
      name: localize(`${TARGET.LARGE}.Name`),
      hint: localize(`${TARGET.LARGE}.Hint`),
      scope: "world",
      config: false,
      type: Boolean,
      default: true,
      tab: "losTarget",
      onChange: value => this.losSettingChange(TARGET.LARGE, value)
    });

    register(TARGET.ALGORITHM, {
      name: localize(`${TARGET.ALGORITHM}.Name`),
      hint: localize(`${TARGET.ALGORITHM}.Hint`),
      scope: "world",
      config: false,
      type: String,
      choices: losChoices,
      default: LTYPES.POINTS,
      tab: "losTarget",
      onChange: value => this.losAlgorithmChange(TARGET.ALGORITHM, value)
    });

    register(PT_OPTS.NUM_POINTS, {
      name: localize(`${PT_OPTS.NUM_POINTS}.Name`),
      hint: localize(`${PT_OPTS.NUM_POINTS}.Hint`),
      scope: "world",
      config: false,
      type: String,
      choices: ptChoices,
      default: PT_TYPES.NINE,
      tab: "losTarget",
      onChange: value => this.losSettingChange(PT_OPTS.NUM_POINTS, value)
    });

    register(PT_OPTS.INSET, {
      name: localize(`${PT_OPTS.INSET}.Name`),
      hint: localize(`${PT_OPTS.INSET}.Hint`),
      range: {
        max: 0.99,
        min: 0,
        step: 0.01
      },
      scope: "world",
      config: false, // () => getSetting(KEYS.LOS.ALGORITHM) !== LTYPES.POINTS,
      default: 0.75,
      type: Number,
      tab: "losTarget",
      onChange: value => this.losSettingChange(PT_OPTS.INSET, value)
    });

    register(PT_OPTS.POINTS3D, {
      name: localize(`${PT_OPTS.POINTS3D}.Name`),
      hint: localize(`${PT_OPTS.POINTS3D}.Hint`),
      scope: "world",
      config: false,
      type: Boolean,
      default: true,
      tab: "losTarget",
      onChange: value => this.losSettingChange(PT_OPTS.POINTS3D, value)
    });

    // ----- NOTE: Workflow tab ----- //

    register(KEYS.COVER_EFFECTS.USE, {
      name: localize(`${KEYS.COVER_EFFECTS.USE}.Name`),
      hint: localize(`${KEYS.COVER_EFFECTS.USE}.Hint`),
      scope: "world",
      config: false,
      type: String,
      choices: coverEffectUseChoices,
      default: ENUMS.USE_CHOICES.NEVER,
      tab: "workflow",
      onChange: _value => TokenCover._forceUpdateAllTokenCover()
    });

    register(KEYS.COVER_EFFECTS.TARGETING, {
      name: localize(`${KEYS.COVER_EFFECTS.TARGETING}.Name`),
      hint: localize(`${KEYS.COVER_EFFECTS.TARGETING}.Hint`),
      scope: "world",
      config: false,
      type: Boolean,
      default: false,
      tab: "workflow",
      onChange: _value => TokenCover._forceUpdateAllTokenCover()
    });

    if ( game.system.id === "dnd5e" ) {
      register(KEYS.COVER_WORKFLOW.CHAT, {
        name: localize(`${KEYS.COVER_WORKFLOW.CHAT}.Name`),
        hint: localize(`${KEYS.COVER_WORKFLOW.CHAT}.Hint`),
        scope: "world",
        config: false,
        type: Boolean,
        default: false,
        tab: "workflow"
      });

      register(KEYS.COVER_WORKFLOW.CONFIRM, {
        name: localize(`${KEYS.COVER_WORKFLOW.CONFIRM}.Name`),
        hint: localize(`${KEYS.COVER_WORKFLOW.CONFIRM}.Hint`),
        scope: "world",
        config: false,
        type: String,
        choices: coverConfirmChoices,
        default: ENUMS.CONFIRM_CHOICES.AUTO,
        horizontalDivider: true,
        tab: "workflow"
      });

      register(KEYS.COVER_WORKFLOW.CONFIRM_NO_COVER, {
        name: localize(`${KEYS.COVER_WORKFLOW.CONFIRM_NO_COVER}.Name`),
        hint: localize(`${KEYS.COVER_WORKFLOW.CONFIRM_NO_COVER}.Hint`),
        scope: "world",
        config: false,
        type: Boolean,
        default: false,
        tab: "workflow"
      });

      register(KEYS.COVER_WORKFLOW.CONFIRM_CHANGE_ONLY, {
        name: localize(`${KEYS.COVER_WORKFLOW.CONFIRM_CHANGE_ONLY}.Name`),
        hint: localize(`${KEYS.COVER_WORKFLOW.CONFIRM_CHANGE_ONLY}.Hint`),
        scope: "world",
        config: false,
        type: Boolean,
        default: false,
        tab: "workflow"
      });
    }

    // ----- NOTE: Other cover settings tab ----- //
    if ( !MODULES_ACTIVE.TOKEN_VISIBILITY ) {
      register(KEYS.PRONE_MULTIPLIER, {
        name: localize(`${KEYS.PRONE_MULTIPLIER}.Name`),
        hint: localize(`${KEYS.PRONE_MULTIPLIER}.Hint`),
        scope: "world",
        config: false,
        type: Number,
        range: {
          max: 1,  // Prone equivalent to standing.
          min: 0,  // Prone equivalent to (almost) not being there at all. Will set to a single pixel.
          step: 0.1
        },
        default: CONFIG.GeometryLib.proneMultiplier ?? 0.33, // Same as Wall Height
        tab: "other",
        onChange: value => CONFIG.GeometryLib.proneMultiplier = value
      });

      register(KEYS.VISION_HEIGHT_MULTIPLIER, {
        name: localize(`${KEYS.VISION_HEIGHT_MULTIPLIER}.Name`),
        hint: localize(`${KEYS.VISION_HEIGHT_MULTIPLIER}.Hint`),
        scope: "world",
        config: false,
        type: Number,
        range: {
          max: 1,  // At token top.
          min: 0,  // At token bottom.
          step: 0.1
        },
        default: CONFIG.GeometryLib.visionHeightMultiplier ?? 0.9,
        tab: "other",
        onChange: value => CONFIG.GeometryLib.visionHeightMultiplier = value
      });

      register(KEYS.PRONE_STATUS_ID, {
        name: localize(`${KEYS.PRONE_STATUS_ID}.Name`),
        hint: localize(`${KEYS.PRONE_STATUS_ID}.Hint`),
        scope: "world",
        config: false,
        type: String,
        default: CONFIG.GeometryLib.proneStatusId || "prone",
        tab: "other",
        onChange: value => CONFIG.GeometryLib.proneMultiplier = value
      });

      register(KEYS.TOKEN_HP_ATTRIBUTE, {
        name: localize(`${KEYS.TOKEN_HP_ATTRIBUTE}.Name`),
        hint: localize(`${KEYS.TOKEN_HP_ATTRIBUTE}.Hint`),
        scope: "world",
        config: false,
        type: String,
        default: "system.attributes.hp.value",
        tab: "other",
        onChange: value => CONFIG.GeometryLib.tokenHPId = value
      });


      // Make sure these are linked at the start.
      CONFIG.GeometryLib.proneMultiplier = this.get(KEYS.PRONE_MULTIPLIER);
      CONFIG.GeometryLib.visionHeightMultiplier = this.get(KEYS.VISION_HEIGHT_MULTIPLIER);
      CONFIG.GeometryLib.proneStatusId = this.get(KEYS.PRONE_STATUS_ID);
      CONFIG.GeometryLib.tokenHPId = this.get(KEYS.TOKEN_HP_ATTRIBUTE);

    } else {
      register(KEYS.ATV_SETTINGS_MESSAGE, {
        name: localize(`${KEYS.ATV_SETTINGS_MESSAGE}.Name`),
        hint: localize(`${KEYS.ATV_SETTINGS_MESSAGE}.Hint`),
        scope: "world",
        config: false,
        type: Boolean,
        default: false,
        // TODO: Open ATV settings? onChange: value => this.losSettingChange(KEYS.PRONE_TOKENS_BLOCK, value),
        tab: "other"
      });
    }

    // ----- NOTE: Hidden settings ----- //
    register(KEYS.AREA3D_USE_SHADOWS, {
      scope: "world",
      config: false,
      type: Boolean,
      default: false
    });

    register(KEYS.COVER_EFFECTS.DATA, {
      scope: "world",
      config: false,
      default: {}
    });

    register(KEYS.COVER_EFFECTS.RULES, {
      scope: "world",
      config: false,
      default: {}
    });

    this.register(KEYS.UNIQUE_EFFECTS_FLAGS_DATA, {
      scope: "world",
      config: false,
      default: {}
    });

    // ----- NOTE: Triggers based on starting settings ---- //
    // Start debug
    if ( this.get(this.KEYS.DEBUG) ) registerDebug();

    // Register the Area3D methods on initial load.
    if ( this.typesWebGL2.has(this.get(TARGET.ALGORITHM)) ) registerArea3d();

  }

  static typesWebGL2 = new Set([
    ENUMS.ALGORITHM_TYPES.AREA3D,
    ENUMS.ALGORITHM_TYPES.AREA3D_WEBGL2,
    ENUMS.ALGORITHM_TYPES.AREA3D_HYBRID]);

  static losAlgorithmChange(key, value) {
    this.cache.delete(key);
    if ( this.typesWebGL2.has(value) ) registerArea3d();
    canvas.tokens.placeables
      .filter(t => t._tokencover) // Don't create a new coverCalc here.
      .forEach(token => token[MODULE_ID].coverCalculator._updateAlgorithm());
  }

  static losSettingChange(key, _value) {
    this.cache.delete(key);
    canvas.tokens.placeables
      .filter(t => t._tokencover) // Don't create a new coverCalc here.
      .forEach(token => token[MODULE_ID].coverCalculator._resetConfiguration());
  }

  static setProneStatusId(value) {
    CONFIG.GeometryLib.proneStatusId = value;
    if ( MODULES_ACTIVE.TOKEN_VISIBILITY) game.settings.set("tokenvisibility", SETTINGS.PRONE_STATUS_ID, value);
  }

}


