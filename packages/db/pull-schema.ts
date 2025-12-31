#!/usr/bin/env bun

const dbUrl = process.env.DATABASE_URL!;

const result = Bun.spawn([
	'atlas',
	'schema',
	'inspect',
	'--url',
	dbUrl,
	'--format',
	'{{ sql . "  " }}',
]);

const text = await new Response(result.stdout).text();

await Bun.write('schema.sql', text);

console.log('✅ Schema pulled from database successfully!');

export {};
