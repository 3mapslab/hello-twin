/*eslint-disable*/
import {LODControl} from "./LODControl";
import {Vector3, Vector2, Raycaster} from "three";
import {MapView} from "../MapView";

/**
 * Use random raycasting to randomly pick n objects to be tested on screen space.
 * 
 * Overall the fastest solution but does not include out of screen objects.
 * 
 * @class LODRaycast
 * @extends {LODControl}
 */
function LODRaycast()
{
	LODControl.call(this);

	/**
	 * Number of rays used to test nodes and subdivide the map.
	 *
	 * N rays are cast each frame dependeing on this value to check distance to the visible map nodes. A single ray should be enough for must scenarios.
	 *
	 * @attribute subdivisionRays
	 * @type {boolean}
	 */
	this.subdivisionRays = 1;

	/**
	 * Threshold to subdivide the map tiles.
	 * 
	 * Lower value will subdivide earlier (less zoom required to subdivide).
	 * 
	 * @attribute thresholdUp
	 * @type {number}
	 */
	this.thresholdUp = 0.6;

	/**
	 * Threshold to simplify the map tiles.
	 * 
	 * Higher value will simplify earlier.
	 *
	 * @attribute thresholdDown
	 * @type {number}
	 */
	this.thresholdDown = 0.15;

	this.raycaster = new Raycaster();

	this.mouse = new Vector2();

	this.vector = new Vector3();
}

LODRaycast.prototype = Object.create(LODControl.prototype);

LODRaycast.prototype.updateLOD = function(view, camera, renderer, scene)
{
	var intersects = [];

	for (var t = 0; t < this.subdivisionRays; t++)
	{
		// Raycast from random point
		this.mouse.set(Math.random() * 2 - 1, Math.random() * 2 - 1);
		
		// Check intersection
		this.raycaster.setFromCamera(this.mouse, camera);
		this.raycaster.intersectObjects(view.children, true, intersects);
	}

	if (view.mode === MapView.SPHERICAL)
	{
		for (var i = 0; i < intersects.length; i++)
		{
			var node = intersects[i].object;
			const distance = Math.pow(intersects[i].distance * 2, node.level);

			if (distance < this.thresholdUp)
			{
				node.subdivide();
				return;
			}
			else if (distance > this.thresholdDown)
			{
				if (node.parentNode !== null)
				{
					node.parentNode.simplify();
					return;
				}
			}
		}
	}
	else // if(this.mode === MapView.PLANAR || this.mode === MapView.HEIGHT)
	{
		for (var i = 0; i < intersects.length; i++)
		{
			var node = intersects[i].object;
			var matrix = node.matrixWorld.elements;
			var scaleX = this.vector.set(matrix[0], matrix[1], matrix[2]).length();
			var value = scaleX / intersects[i].distance;

			if (value > this.thresholdUp)
			{
				node.subdivide();
				return;
			}
			else if (value < this.thresholdDown)
			{
				if (node.parentNode !== null)
				{
					node.parentNode.simplify();
					node.parentNode.childrenCache = null;
					//node.parentNode.loadTexture = null;
					return;
				}
			}
		}
	}
};

export {LODRaycast};
