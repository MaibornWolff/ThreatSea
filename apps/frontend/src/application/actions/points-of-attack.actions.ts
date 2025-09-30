/**
 * @module points-of-attack.actions - Defines the actions
 *     for the points of attack.
 */
import { createAction } from "@reduxjs/toolkit";

/**
 * Wrapper class for defining functions for
 * the point of attack actions.
 */
export class PointsOfAttackActions {
    /**
     * Action that creates a point of attack.
     * @function createPointOfAttack
     * @param {string} type - Action type.
     * @returns Action function for creating a point of attack.
     */
    static createPointOfAttack = createAction("[points of attack] create point of attack");

    /**
     * Action that changes a point of attack.
     * @function setPointOfAttack
     * @param {string} type - Action type.
     * @returns Action function for changing a point of attack.
     */
    static setPointOfAttack = createAction("[points of attack] set point of attack");

    /**
     * Action that sets multiple points of attack under the risk page.
     * @function setPointsOfAttack
     * @param {string} type - Action type.
     * @returns Action function for changing multiple points of attack
     *     under the risk page.
     */
    static setPointsOfAttack = createAction("[points of attack] set points of attack");

    /**
     * Action that removes multiple points of attack
     * @function removePointsOfAttack
     * @param {string} type - Action type.
     * @returns Action function for removing multiple points of attack.
     */
    static removePointsOfAttack = createAction("[points of attack] remove points of attack");

    /**
     * Action that removes a point of attack.
     * @function removePointOfAttack
     * @param {string} type - Action type.
     * @returns Action function for removing a point of attack.
     */
    static removePointOfAttack = createAction("[points of attack] remove point of attack");
}
