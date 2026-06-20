import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  detectFramework,
  getClaudeIgnore,
  detectFromPackageJson,
  detectFromRequirements,
  detectFromPyproject,
  detectFromComposer,
  detectFromGemfile,
  detectFromPom,
} from '../src/lib/frameworks.js';

describe('unit — pure logic', () => {
  describe('detectFromPackageJson', () => {
    it('detects nextjs', () => {
      assert.strictEqual(detectFromPackageJson(JSON.stringify({ dependencies: { next: '14.0.0' } })), 'nextjs');
    });
    it('detects nuxtjs', () => {
      assert.strictEqual(detectFromPackageJson(JSON.stringify({ dependencies: { nuxt: '3.0.0' } })), 'nuxtjs');
    });
    it('detects angular', () => {
      assert.strictEqual(detectFromPackageJson(JSON.stringify({ dependencies: { '@angular/core': '17.0.0' } })), 'angular');
    });
    it('detects nestjs', () => {
      assert.strictEqual(detectFromPackageJson(JSON.stringify({ dependencies: { '@nestjs/core': '10.0.0' } })), 'nestjs');
    });
    it('detects svelte from devDependencies', () => {
      assert.strictEqual(detectFromPackageJson(JSON.stringify({ devDependencies: { svelte: '4.0.0' } })), 'svelte');
    });
    it('detects vue', () => {
      assert.strictEqual(detectFromPackageJson(JSON.stringify({ dependencies: { vue: '3.0.0' } })), 'vue');
    });
    it('detects express', () => {
      assert.strictEqual(detectFromPackageJson(JSON.stringify({ dependencies: { express: '4.18.0' } })), 'express');
    });
    it('detects react', () => {
      assert.strictEqual(detectFromPackageJson(JSON.stringify({ dependencies: { react: '18.0.0', 'react-dom': '18.0.0' } })), 'react');
    });
    it('detects react from devDependencies', () => {
      assert.strictEqual(detectFromPackageJson(JSON.stringify({ devDependencies: { react: '18.0.0' } })), 'react');
    });
    it('next takes priority over react', () => {
      assert.strictEqual(detectFromPackageJson(JSON.stringify({ dependencies: { next: '14.0.0', react: '18.0.0' } })), 'nextjs');
    });
    it('next takes priority over vue', () => {
      assert.strictEqual(detectFromPackageJson(JSON.stringify({ dependencies: { next: '14.0.0', vue: '3.0.0' } })), 'nextjs');
    });
    it('returns null for unknown deps', () => {
      assert.strictEqual(detectFromPackageJson(JSON.stringify({ dependencies: { lodash: '4.0.0' } })), null);
    });
    it('returns null for malformed JSON', () => {
      assert.strictEqual(detectFromPackageJson('not json'), null);
    });
  });

  describe('detectFromRequirements', () => {
    it('detects django', () => {
      assert.strictEqual(detectFromRequirements('Django==4.2\npsycopg2==2.9\n'), 'django');
    });
    it('detects fastapi', () => {
      assert.strictEqual(detectFromRequirements('fastapi==0.100.0\nuvicorn==0.22.0\n'), 'fastapi');
    });
    it('returns null for unknown content', () => {
      assert.strictEqual(detectFromRequirements('numpy==1.24.0\n'), null);
    });
  });

  describe('detectFromPyproject', () => {
    it('detects django', () => {
      assert.strictEqual(detectFromPyproject('[tool.django]\nname = "myapp"'), 'django');
    });
    it('detects fastapi', () => {
      assert.strictEqual(detectFromPyproject('dependencies = ["fastapi>=0.100"]'), 'fastapi');
    });
    it('returns null for unknown content', () => {
      assert.strictEqual(detectFromPyproject('[tool.pytest]\n'), null);
    });
  });

  describe('detectFromComposer', () => {
    it('detects laravel', () => {
      assert.strictEqual(detectFromComposer(JSON.stringify({ require: { 'laravel/framework': '^10.0' } })), 'laravel');
    });
    it('returns null for other packages', () => {
      assert.strictEqual(detectFromComposer(JSON.stringify({ require: { 'symfony/framework': '6.0' } })), null);
    });
    it('returns null for malformed JSON', () => {
      assert.strictEqual(detectFromComposer('not json'), null);
    });
  });

  describe('detectFromGemfile', () => {
    it('detects rails', () => {
      assert.strictEqual(detectFromGemfile("source 'https://rubygems.org'\ngem 'rails', '~> 7.1'\n"), 'rails');
    });
    it('returns null for non-rails Gemfile', () => {
      assert.strictEqual(detectFromGemfile("gem 'sinatra'\n"), null);
    });
  });

  describe('detectFromPom', () => {
    it('detects spring-boot', () => {
      assert.strictEqual(detectFromPom('<artifactId>spring-boot-starter-web</artifactId>'), 'spring-boot');
    });
    it('returns null for non-spring pom', () => {
      assert.strictEqual(detectFromPom('<artifactId>my-app</artifactId>'), null);
    });
  });

  describe('getClaudeIgnore', () => {
    it('nextjs ignore contains snapshot patterns', () => {
      const content = getClaudeIgnore('nextjs');
      assert.ok(content.includes('*.snap'));
      assert.ok(content.includes('__snapshots__'));
    });

    it('express ignore contains *.min.js', () => {
      assert.ok(getClaudeIgnore('express').includes('*.min.js'));
    });

    it('react ignore contains build pattern', () => {
      assert.ok(getClaudeIgnore('react').includes('build/**'));
    });

    it('django ignore contains migrations pattern', () => {
      assert.ok(getClaudeIgnore('django').includes('migrations'));
    });

    it('go ignore contains *.pb.go', () => {
      assert.ok(getClaudeIgnore('go').includes('*.pb.go'));
    });

    it('laravel ignore contains *.lock', () => {
      assert.ok(getClaudeIgnore('laravel').includes('*.lock'));
    });

    it('base ignore contains user-facing doc exclusions', () => {
      const content = getClaudeIgnore(null);
      assert.ok(content.includes('README.md'));
      assert.ok(content.includes('CHANGELOG.md'));
      assert.ok(content.includes('CONTRIBUTING.md'));
      assert.ok(content.includes('GEMINI.md'));
      assert.ok(content.includes('AGENTS.md'));
      assert.ok(content.includes('.cursorrules'));
      assert.ok(content.includes('.windsurfrules'));
      assert.ok(content.includes('.clinerules'));
      assert.ok(content.includes('.roomodes'));
    });

    it('framework-specific ignore inherits base user-facing doc exclusions', () => {
      const content = getClaudeIgnore('express');
      assert.ok(content.includes('README.md'));
      assert.ok(content.includes('CONTRIBUTING.md'));
    });
  });
});

describe('integration — filesystem', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cto-fw-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });

  function write(rel, content) {
    const full = path.join(tmpDir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, 'utf8');
  }

  it('detectFramework: returns null for empty directory', () => {
    assert.strictEqual(detectFramework(tmpDir), null);
  });

  it('detectFramework: detects nextjs from package.json', () => {
    write('package.json', JSON.stringify({ dependencies: { next: '14.0.0' } }));
    assert.strictEqual(detectFramework(tmpDir), 'nextjs');
  });

  it('detectFramework: detects nuxtjs from package.json', () => {
    write('package.json', JSON.stringify({ dependencies: { nuxt: '3.0.0' } }));
    assert.strictEqual(detectFramework(tmpDir), 'nuxtjs');
  });

  it('detectFramework: detects angular from package.json', () => {
    write('package.json', JSON.stringify({ dependencies: { '@angular/core': '17.0.0' } }));
    assert.strictEqual(detectFramework(tmpDir), 'angular');
  });

  it('detectFramework: detects nestjs from package.json', () => {
    write('package.json', JSON.stringify({ dependencies: { '@nestjs/core': '10.0.0' } }));
    assert.strictEqual(detectFramework(tmpDir), 'nestjs');
  });

  it('detectFramework: detects svelte from package.json', () => {
    write('package.json', JSON.stringify({ devDependencies: { svelte: '4.0.0' } }));
    assert.strictEqual(detectFramework(tmpDir), 'svelte');
  });

  it('detectFramework: detects vue from package.json', () => {
    write('package.json', JSON.stringify({ dependencies: { vue: '3.0.0' } }));
    assert.strictEqual(detectFramework(tmpDir), 'vue');
  });

  it('detectFramework: detects express from package.json', () => {
    write('package.json', JSON.stringify({ dependencies: { express: '4.18.0' } }));
    assert.strictEqual(detectFramework(tmpDir), 'express');
  });

  it('detectFramework: detects react from package.json', () => {
    write('package.json', JSON.stringify({ dependencies: { react: '18.0.0', 'react-dom': '18.0.0' } }));
    assert.strictEqual(detectFramework(tmpDir), 'react');
  });

  it('detectFramework: next takes priority over react', () => {
    write('package.json', JSON.stringify({ dependencies: { next: '14.0.0', react: '18.0.0' } }));
    assert.strictEqual(detectFramework(tmpDir), 'nextjs');
  });

  it('detectFramework: detects django from requirements.txt', () => {
    write('requirements.txt', 'Django==4.2\npsycopg2==2.9\n');
    assert.strictEqual(detectFramework(tmpDir), 'django');
  });

  it('detectFramework: detects fastapi from requirements.txt', () => {
    write('requirements.txt', 'fastapi==0.100.0\nuvicorn==0.22.0\n');
    assert.strictEqual(detectFramework(tmpDir), 'fastapi');
  });

  it('detectFramework: detects go from go.mod', () => {
    write('go.mod', 'module example.com/myapp\n\ngo 1.21\n');
    assert.strictEqual(detectFramework(tmpDir), 'go');
  });

  it('detectFramework: detects laravel from composer.json', () => {
    write('composer.json', JSON.stringify({ require: { 'laravel/framework': '^10.0' } }));
    assert.strictEqual(detectFramework(tmpDir), 'laravel');
  });

  it('detectFramework: detects rails from Gemfile', () => {
    write('Gemfile', "source 'https://rubygems.org'\ngem 'rails', '~> 7.1'\n");
    assert.strictEqual(detectFramework(tmpDir), 'rails');
  });

  it('detectFramework: next takes priority over other node deps', () => {
    write('package.json', JSON.stringify({ dependencies: { next: '14.0.0', vue: '3.0.0' } }));
    assert.strictEqual(detectFramework(tmpDir), 'nextjs');
  });

  it('detectFramework: falls back to null for unknown package.json', () => {
    write('package.json', JSON.stringify({ dependencies: { lodash: '4.0.0' } }));
    assert.strictEqual(detectFramework(tmpDir), null);
  });
});
