import { TextureLoader, SRGBColorSpace, RepeatWrapping, Mesh, MeshLambertMaterial, PlaneGeometry, Vector2 } from '/js/modules/three.module.js'

const process = []
const textureLoader = new TextureLoader()

export default (args) => {
	if (!args.textures) return
	args.textures.forEach(el => {
		process.push(
			new Promise((resolve, reject) => {
				textureLoader.load(`/textures/${el.texture}`, texture => {
					texture.materialType = el.type
					texture.colorSpace = SRGBColorSpace
					texture.wrapS = RepeatWrapping
					texture.wrapT = RepeatWrapping
					if (args.repeat) texture.repeat.set(args.repeat, args.repeat)
					resolve(texture)
				}, undefined, error => {
					reject(error)
				})
			})
		)
	})
	return new Promise((resolve, reject) => {
		Promise.all(process)
		.then(response => {
			const material = new MeshLambertMaterial()
			if (args.aoMapIntensity) material.aoMapIntensity = args.aoMapIntensity
			if (args.emissiveIntensity) material.emissiveIntensity = args.emissiveIntensity
			if (args.flatShading) material.flatShading = args.flatShading
			if (args.displacementScale) material.displacementScale = args.displacementScale
			if (args.displacementBias) material.displacementBias = args.displacementBias
			if (typeof args.normalScale == 'object') material.normalScale = new Vector2(args.normalScale[0], args.normalScale[1])
			if (typeof args.normalScale == 'number') material.normalScale = new Vector2(args.normalScale, args.normalScale)
			response.forEach(el => {
				material[el.materialType] = el
			})
			resolve(material)
		})
		.catch(error => {
			reject(error)
		})
	})
}