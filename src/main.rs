#[macro_use]
extern crate processing as p5;
extern crate lodepng;
extern crate byteorder;
extern crate gl;

use std::path::Path;
use std::env;
use std::mem;
use std::io;

use p5::shapes::rect::Rect;
use p5::shapes::mould::Mould;

use p5::GlObject;
use p5::uniforms::AsUniformValue;

use byteorder::{BigEndian, WriteBytesExt};

fn main() {
    let mut screen = p5::Screen::new(600, 600, false, false, false).unwrap();

    let (tex1, _, _) = screen.empty_texture(600, 600).unwrap();
    let (tex2, _, _) = screen.empty_texture(600, 600).unwrap();

    let texs = vec![tex1, tex2];
    let t1b = &texs[0];
    let t2b = &texs[1];

    let mut sh = screen.load_frag_shader("voronoi.frag").unwrap();
    let r = Rect::new(&screen, &[-1.], &[1.], &[0.], &[2.], &[2.]).unwrap();
    let mut m = Mould::new(&r, &mut sh);
    m.set("screenWidth", (600f32).as_uniform_value());
    m.set("screenHeight", (600f32).as_uniform_value());
    m.set("tex", t1b.as_uniform_value());
    m.set("iFrame", (0f32).as_uniform_value());

    let mut despeck_sh = screen.load_frag_shader("despeckle.frag").unwrap();
    let despeck_r = Rect::new(&screen, &[-1.], &[1.], &[0.], &[2.], &[2.]).unwrap();
    let mut despeck_m = Mould::new(&despeck_r, &mut despeck_sh);
    despeck_m.set("screenWidth", (600f32).as_uniform_value());
    despeck_m.set("screenHeight", (600f32).as_uniform_value());
    despeck_m.set("tex", t1b.as_uniform_value());

    let mut gauss_sh = screen.load_frag_shader("gaussian.frag").unwrap();
    let gauss_r = Rect::new(&screen, &[-1.], &[1.], &[0.], &[2.], &[2.]).unwrap();
    let mut gauss_m = Mould::new(&gauss_r, &mut gauss_sh);
    gauss_m.set("screenWidth", (600f32).as_uniform_value());
    gauss_m.set("screenHeight", (600f32).as_uniform_value());
    gauss_m.set("tex", t2b.as_uniform_value());

    // loop {
        {
            let mut fb = screen.framebuffer(&texs[0]).unwrap();
            screen.clear_framebuffer(&mut fb, 0.8, 0.8, 0.8, 1.0);
            screen.draw_mould_onto_framebuffer(&m, &mut fb);
        }

        let mut r = Rect::new(&screen, &[-1.], &[1.], &[0.], &[2.], &[2.]).unwrap();
        r.attach_texture(&texs[0]);

        screen.background(0.8, 0.8, 0.8, 1.0);
        screen.draw(&r);

        {
            let mut fb = screen.framebuffer(&texs[1]).unwrap();
            screen.clear_framebuffer(&mut fb, 0.8, 0.8, 0.8, 1.0);
            screen.draw_mould_onto_framebuffer(&despeck_m, &mut fb);
        }

        let mut r = Rect::new(&screen, &[-1.], &[1.], &[0.], &[2.], &[2.]).unwrap();
        r.attach_texture(&texs[1]);

        screen.background(0.8, 0.8, 0.8, 1.0);
        screen.draw(&r);

        {
            let mut fb = screen.framebuffer(&texs[0]).unwrap();
            screen.clear_framebuffer(&mut fb, 0.8, 0.8, 0.8, 1.0);
            screen.draw_mould_onto_framebuffer(&gauss_m, &mut fb);
        }

        let mut r = Rect::new(&screen, &[-1.], &[1.], &[0.], &[2.], &[2.]).unwrap();
        r.attach_texture(&texs[0]);

        screen.background(0.8, 0.8, 0.8, 1.0);
        screen.draw(&r);
        screen.reveal();
    // }

    // screen.save("voronoi.png");

    let mut data = vec![0f32; 600 * 600 * 3];
    unsafe {
        gl::Finish();
        // gl::GetTextureImage(
        //     texs[0].get_id(),
        //     0,
        //     gl::RGB,
        //     gl::FLOAT,
        //     600 * 600 * 3 * 4,
        //     mem::transmute(&data[0]),
        // );
        gl::BindTexture(
            gl::TEXTURE_2D,
            texs[0].get_id()
        );
        gl::GetTexImage(
            gl::TEXTURE_2D,
            0,
            gl::RGB,
            gl::FLOAT,
            mem::transmute(&data[0]),
        );
        gl::Finish();
    }

    let mut data_flipped = vec![0f32; 600 * 600 * 3];
    for y in (0..600).rev() {
        for x in 0..600 {
            for c in 0..3 {
                data_flipped[(599 - y) * 600 * 3 + x * 3 + c] = data[y * 600 * 3 + x * 3 + c];
            }
        }
    }

    let mut data_rgb_u16 = vec![];
    let mut i = 0;
    for (i, d) in data_flipped.iter().enumerate() {
        if i < 100 {
            println!("{}", d);
        }
        data_rgb_u16.write_u16::<BigEndian>((*d * 65535.0) as u16).unwrap();
    }

    if let Err(e) = lodepng::encode_file("voronoi.png", &data_rgb_u16, 600, 600, lodepng::LCT_RGB, 16) {
        panic!("failed to write png: {}", e);
    }
}
