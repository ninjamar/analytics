/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */


import { createHash } from "node:crypto";
import { UAParser } from "ua-parser-js";

function error400(){
	return new Response("400 Error", {status: 400});
}
function error404(){
	return new Response("404 Page Not Found", {status: 404});
}
function error405(){
	return new Response("405 Invalid Method", {status: 405});
}

function joinObj(obj){
	return Object.keys(obj).map(k => obj[k]).join(" ");
}

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);

		// Verify origin only if POST
		if (request.method == "POST"){
			const origin = new URL(request.headers.get("origin"));

			if (new RegExp(env.ALLOWED_URLS_REGEX, "m").test(origin.hostname + ":" + origin.port)){
				return error400();
			}
		}
		
		if (url.pathname == "/v1/info"){
			if (request.method != "POST"){
				return error405();
			}
			const json = await request.json();

			const ua = new UAParser(json.userAgent);
			const os = joinObj(ua.getOS());
			const browser = joinObj(ua.getBrowser());

			const date = new Date();
			const id = createHash("sha256")
				.update(
					request.headers.get("CF-Connecting-UP") 
					+ os
					+ browser
					+ date.getDay() 
					+ date.getMonth() 
					+ date.getFullYear()
				).digest("hex"); // ip + ua + timezone + month + day + year

			// Check if any records exist where id = json.id
			let currentRecords = await env.DB.prepare("SELECT * FROM analytics WHERE id = ?").bind(id).all();
			if (currentRecords.results.length > 0){
				/* ["/":001] */
				let pathData = JSON.parse(currentRecords.results[0].pathData);
				if (Object.keys(pathData).includes(json.path)){
					pathData[json.path] = pathData[json.path] + json.totalTimeOnPage;
				} else {
					pathData[json.path] = json.totalTimeOnPage;
				}
				pathData = JSON.stringify(pathData);
				// Update record with additional time on page
				await env.DB.prepare("UPDATE analytics SET pathData = ?1 WHERE id = ?2 ").bind(pathData, id).run();
			} else {
				// Insert new record into DB
				await env.DB.prepare(`INSERT INTO analytics (
						id,
						currentTime, 
						width, 
						height, 
						os,
						browser,
						isMobile, 
						isTouchScreen, 
						referrer, 
						host,
						port,
						pathData
					) VALUES (
						?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?8, ?10, ?11, ?12
					);`
				).bind(
					id,
					json.currentTime,
					json.width,
					json.height,
					os,
					browser,
					json.isMobile, // bool -> int
					json.isTouchScreen, // bool -> int
					json.referrer || null, // there isn't always a referrer
					json.host,
					json.port || null,
					JSON.stringify({[json.path] : json.totalTimeOnPage})
				).run();
			}
			return Response.json({status: "success"})
		}
		return new Response('Hello, World!');
	},
};
