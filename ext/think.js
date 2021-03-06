var Markov = require('../lib/markov');
module.exports = [{
    'event': 'messageCreate',
    'disabled': false,
    'execute': async function(ctx, msg) {
        var args = msg.content.replace('knuckles', '');
        if (!ctx._chans || !ctx._chans[msg.channel.id]) {
            var c = await ctx.sql._db.models.k_chans.findOne({
                where: {
                    chan_id: msg.channel.id
                }
            });
            if (!ctx._chans) ctx._chans = {};
            ctx._chans[msg.channel.id] = c ? c.dataValues.enabled : false;
        }
        if (!ctx._chans || !ctx._chans[msg.channel.id]) return;
        if (msg.author.id == ctx.bot.user.id) return;
        train(ctx.util.fs, ctx.util.path, args);
        if (!ctx._net) ctx._net = {};
        if (!ctx._net.cache) ctx._net.cache = await get(ctx.util.fs, ctx.util.path);
        if (!msg.content.includes('knuckles')) return;
        var size = Math.ceil(Math.random() * args.split(' ').length * 2);
        var temp_markov = new Markov(split(ctx._net.cache), size);
        var result = temp_markov.generate();
        if (result.length < 2000) {
            if (!ctx._stat_cache[msg.author.id]) ctx._stat_cache[msg.author.id] = {}
            if (!ctx._stat_cache[msg.author.id]['s_talk_to_knuckles']) ctx._stat_cache[msg.author.id]['s_talk_to_knuckles'] = 0;
            ctx._stat_cache[msg.author.id]['s_talk_to_knuckles']++;
            msg.channel.createMessage(result);
        }
        else {
            msg.channel.createMessage('too long!');
        }
    }
}]

function shuffle(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}
async function train(fs, path, t) {
    if (fs && path) {
        let f = await get();
        f += " " + t;
        spread(fs, path, f);
    }
}
async function scramble(fs, path) {
    let f = await get();
    let a = f.split(" ");
    a = shuffle(a);
    let newf = a.join(" ");
    spread(fs, path, newf);
}
async function get(fs, path) {
    if (fs && path) {
        let dir = fs.readdirSync(path.join(__dirname, "../training"));
        let f = "";
        for (let d in dir) {
            let p = path.join(__dirname, "../training", dir[d]);
            let fi = fs.readFileSync(p, "utf8");
            f += (fi.split("\n").join(" ")) + " ";
        }
        //console.log(f);
        return f.trim();
    }
}
async function spread(fs, path, t) {
    //console.log(t);
    let emr = /<\s:\s\w+\s:\s\d+\s>/g
    t = t.replace(emr, "")
    let dir = fs.readdirSync(path.join(__dirname, "../training"));
    let r = t.split(" ");
    let l = dir.length;
    let tn = r.length;
    let an = tn / l;
    for (let d in dir) {
        let p = path.join(__dirname, "../training", dir[d]);
        if (an > r.length) {
            an = r.length;
        }
        let a = r
            .slice(0, an)
            .join(" ");
        r = r.slice(an, r.length);
        //console.log(p, a, a.length);
        fs.writeFileSync(p, a);
    }
}

function split(cache) {
    return (cache.split(' ').slice(1, 1000)).join(' ');
}