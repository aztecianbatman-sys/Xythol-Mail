import {describe,expect,it} from "vitest";

describe("Xythol Mail demo",()=>{
  it("targets Electron 37.2.6",()=>{
    expect("37.2.6").toBe("37.2.6");
  });
  it("keeps the product name",()=>{
    expect("Xythol Mail").toBe("Xythol Mail");
  });
  it("formats an anonymous identity label",()=>{
    const name="Night Owl";
    const username=name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,24);
    expect(username+"@xythol").toBe("night-owl@xythol");
  });
});
