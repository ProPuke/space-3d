declare class Space3d {
	constructor(canvasOrContext?:HTMLCanvasElement|WebGLRenderingContext|WebGL2RenderingContext);

	discard():void;

	render(params:{
		seed: string,
		resolution: number,
		stars: boolean,
		pointStars: boolean,
		nebulae: boolean,
		nebulaColorBegin:[number,number,number],
		nebulaColorEnd:[number,number,number],
		sun: boolean,
		sunFalloff: number,
		backgroundColor: [number,number,number],
		renderToTexture?: false
	}):Record<'front'|'back'|'left'|'right'|'top'|'bottom',HTMLCanvasElement>;

	render(params:{
		seed: string,
		resolution: number,
		stars: boolean,
		pointStars: boolean,
		nebulae: boolean,
		nebulaColorBegin:[number,number,number],
		nebulaColorEnd:[number,number,number],
		sun: boolean,
		sunFalloff: number,
		backgroundColor: [number,number,number],
		renderToTexture: [WebGLFramebuffer,WebGLFramebuffer,WebGLFramebuffer,WebGLFramebuffer,WebGLFramebuffer,WebGLFramebuffer]
	}):Record<'front'|'back'|'left'|'right'|'top'|'bottom',WebGLFramebuffer>;

	render(params:{
		seed: string,
		resolution: number,
		stars: boolean,
		pointStars: boolean,
		nebulae: boolean,
		nebulaColorBegin:[number,number,number],
		nebulaColorEnd:[number,number,number],
		sun: boolean,
		sunFalloff: number,
		backgroundColor: [number,number,number],
		renderToTexture: [WebGLTexture,WebGLTexture,WebGLTexture,WebGLTexture,WebGLTexture,WebGLTexture]|true
	}):Record<'front'|'back'|'left'|'right'|'top'|'bottom',WebGLTexture>;
}

export default Space3d;
